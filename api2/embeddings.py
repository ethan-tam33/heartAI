import nibabel as nib
from nibabel.fileholders import FileHolder
import io
import base64
import numpy as np
import torch
from torch import nn
from monai.transforms import Compose, Resize, ScaleIntensity, ToTensor

class NIfTIToEmbedding:
    def __init__(self, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.device = device
        self.model = self._build_model().to(device)
        self.preprocess = Compose([
            Resize(spatial_size=(128, 128, 64)),
            ScaleIntensity(minv=0.0, maxv=1.0),
            ToTensor(dtype=torch.float32)
        ])

    def _build_model(self):
        return nn.Sequential(
            nn.Conv3d(1, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2),
            nn.Conv3d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2),
            nn.Conv3d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv3d(256, 512, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Flatten(start_dim=2),
            nn.Linear(16384, 512),
            nn.TransformerEncoder(
                nn.TransformerEncoderLayer(
                    d_model=512, 
                    nhead=8, 
                    dim_feedforward=2048, 
                    batch_first=True
                ),
                num_layers=6
            ),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten()
        )

    def load_nifti(self, path):
        """Load from disk."""
        img = nib.load(path)
        data = img.get_fdata().astype(np.float32)
        return self.preprocess(data[np.newaxis, ...])  # add channel

    def load_nifti_from_base64(self, base64_string: str):
        """Load from base64."""
        try:
            # Decode base64 -> bytes
            nifti_data = base64.b64decode(base64_string)

            file_map = nib.Nifti1Image.make_file_map()
            # Just set the "image" key
            file_map["image"].fileobj = io.BytesIO(nifti_data)

            # Create the image from file_map
            img = nib.Nifti1Image.from_file_map(file_map)

            data = img.get_fdata().astype(np.float32)
            return self.preprocess(data[np.newaxis, ...])  # add channel
        except Exception as e:
            raise ValueError(f"Error decoding or loading NIfTI from base64: {e}")

    @torch.no_grad()
    def __call__(self, nii_path: str):
        """Get embedding from file path."""
        x = self.load_nifti(nii_path).unsqueeze(0).to(self.device)
        return self.model(x).cpu().numpy()

    @torch.no_grad()
    def embedding_from_base64(self, base64_string: str):
        """Get embedding directly from base64."""
        x = self.load_nifti_from_base64(base64_string).unsqueeze(0).to(self.device)
        return self.model(x).cpu().numpy()

# Usage Example:
# from_disk = NIfTIToEmbedding()("/path/to/your_file.nii")
#
# with open("/path/to/your_file.nii", "rb") as f:
#     base64_nifti = base64.b64encode(f.read()).decode('utf-8')
#
# from_base64 = NIfTIToEmbedding().embedding_from_base64(base64_nifti)
#
# print("From disk shape:", from_disk.shape)
# print("From base64 shape:", from_base64.shape)
