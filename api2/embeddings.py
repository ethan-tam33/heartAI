import torch
import nibabel as nib
import numpy as np
from torch import nn
from monai.transforms import Compose, Resize, ScaleIntensity, ToTensor

class NIfTIToEmbedding:
    def __init__(self, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.device = device
        self.model = self._build_model().to(device)
        self.preprocess = Compose([
            Resize(spatial_size=(128, 128, 64)),  # Standardize input dimensions
            ScaleIntensity(minv=0.0, maxv=1.0),  # Normalize to [0,1]
            ToTensor()
        ])

    def _build_model(self):
        return nn.Sequential(
            # 3D CNN Feature Extractor (4 layers)
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
            
            # Flatten and reshape for Transformer
            nn.Flatten(start_dim=2),
            nn.Linear(16384, 512),  # Adjust input size to match flattened CNN output
            
            # Transformer Context Module
            nn.TransformerEncoder(
                encoder_layer=nn.TransformerEncoderLayer(
                    d_model=512,
                    nhead=8,
                    dim_feedforward=2048,
                    batch_first=True
                ),
                num_layers=6
            ),
            
            # Global Pooling
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten()
        )

    def load_nifti(self, path):
        """Load and preprocess NIfTI file"""
        img = nib.load(path)
        data = img.get_fdata()
        return self.preprocess(data[np.newaxis,...])  # Add channel dimension

    def __call__(self, nii_path):
        with torch.no_grad():
            x = self.load_nifti(nii_path).unsqueeze(0).to(self.device)
            print(f"Input shape: {x.shape}")  # Debugging information
            return self.model(x).cpu().numpy()

# Usage
embedder = NIfTIToEmbedding()
heart_embedding = embedder("/Users/socratesj.osorio/Development/heartAI/api2/mesh1.nii")

print(f"Generated embedding shape: {heart_embedding.shape}")