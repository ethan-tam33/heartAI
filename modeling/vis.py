import numpy as np
import plotly.graph_objects as go
import matplotlib.pyplot as plt
from skimage.measure import marching_cubes
from scipy.ndimage import gaussian_filter
import nibabel as nib

def tensor_to_3d_points(heart_ten, cropped):
    w, h, l = heart_ten.shape
    color_lim = np.max(cropped)
    scatter_coords = {}
    scatter_colors = {}
    for i in range(w):
        for j in range(h):
            for k in range(l):
                c = heart_ten[i][j][k]
                if c != 0:
                    if c not in scatter_coords:
                        scatter_coords[c] = []
                        scatter_colors[c] = []
                    scatter_coords[c].append([i, j, k])
                    scatter_colors[c].append(cropped[i][j][k] / color_lim)
    return scatter_coords, scatter_colors

def plot_smooth_heart(voxel_map, az=94, el=15, cmap_name="RdYlBu", sigma=1.0, export_html="smooth_heart.html"):
    fig = go.Figure()
    cmap = plt.get_cmap(cmap_name)

    # Get unique keys and determine intensity scaling
    unique_keys = list(voxel_map.keys())
    num_regions = len(unique_keys)
    
    # Assign colors based on normalized index in colormap
    key_colors = {k: cmap(i / (num_regions - 1 if num_regions > 1 else 1))[:3] for i, k in enumerate(unique_keys)}

    for k in unique_keys:
        reg = np.array(voxel_map[k])  # Voxel positions
        
        if reg.shape[0] == 0:
            continue  # Skip empty regions
        
        # Define voxel grid size dynamically based on max indices
        grid_size = np.max(reg, axis=0) + 3  # Add padding to avoid boundary issues
        voxel_grid = np.zeros(grid_size, dtype=np.float32)
        voxel_grid[reg[:, 0], reg[:, 1], reg[:, 2]] = 1  # Set occupied voxels

        # 🔹 Apply Gaussian Smoothing for softer edges
        voxel_grid = gaussian_filter(voxel_grid, sigma=sigma)

        # Compute mesh using marching cubes
        verts, faces, _, _ = marching_cubes(voxel_grid, level=0.3)  # Lower threshold for better smoothing

        # Assign a unique smooth color per region
        region_color = key_colors[k]
        mesh_colors = 'rgb({}, {}, {})'.format(
            int(region_color[0] * 255),
            int(region_color[1] * 255),
            int(region_color[2] * 255)
        )

        # Add smooth surface mesh with toggleable traces
        fig.add_trace(go.Mesh3d(
            x=verts[:, 0], y=verts[:, 1], z=verts[:, 2],
            i=faces[:, 0], j=faces[:, 1], k=faces[:, 2],
            color=mesh_colors,
            opacity=1.0,  # Slight transparency for depth perception
            lighting=dict(ambient=0.8, diffuse=0.8),
            name=f"Region {k}",  # Legend entry
            visible=True  # Allows toggling
        ))

    # Set camera view and add interactive legend
    fig.update_layout(
        title="Smooth 3D Heart Visualization",
        showlegend=True  # Enables trace selection in legend
    )

    # Save interactive HTML
    fig.write_html(export_html)
    print(f"Interactive plot saved as {export_html}")
    fig.show()


# EXAMPLE USE - load data
data_path = "data/25226366/cropped/"
patient_no = 0
data_end = np.array(nib.load(data_path + "pat" + str(patient_no) + "_cropped_seg_endpoints.nii.gz").get_fdata())  # change to .nii
data_seg = np.array(nib.load(data_path + "pat" + str(patient_no) + "_cropped_seg.nii.gz").get_fdata())  # change to .nii
data_cropped = np.array(nib.load(data_path + "pat" + str(patient_no) + "_cropped.nii.gz").get_fdata())  # change to .nii
print("endpoint data shape: " + str(data_end.shape))
print("cropped data shape: " + str(data_cropped.shape))
print("segmented data shape: " + str(data_seg.shape))
# process and create html
processed_data, processed_colors = tensor_to_3d_points(data_seg, data_cropped)
plot_smooth_heart(processed_data, processed_colors, export_html="smooth_heart_2.html")
