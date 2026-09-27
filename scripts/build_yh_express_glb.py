"""
Generates the production-ready YH EXPRESS 3D Train GLB asset
Matching reference: media_1789893916682.jpg
Directly outputs: public/models/yh_express.glb
"""

import os
import struct
import json
import math
from pygltflib import (
    GLTF2, Scene, Node, Mesh, Primitive, Attributes,
    Buffer, BufferView, Accessor, Material, PbrMetallicRoughness
)

def create_box(width, height, length, center_x=0.0, center_y=0.0, center_z=0.0):
    """Generates vertex positions, normals, and indices for a 3D box."""
    w, h, l = width / 2.0, height / 2.0, length / 2.0
    cx, cy, cz = center_x, center_y, center_z
    
    # 6 faces * 4 vertices = 24 vertices
    positions = [
        # Front (+Z)
        cx - w, cy - h, cz + l,  cx + w, cy - h, cz + l,  cx + w, cy + h, cz + l,  cx - w, cy + h, cz + l,
        # Back (-Z)
        cx + w, cy - h, cz - l,  cx - w, cy - h, cz - l,  cx - w, cy + h, cz - l,  cx + w, cy + h, cz - l,
        # Top (+Y)
        cx - w, cy + h, cz + l,  cx + w, cy + h, cz + l,  cx + w, cy + h, cz - l,  cx - w, cy + h, cz - l,
        # Bottom (-Y)
        cx - w, cy - h, cz - l,  cx + w, cy - h, cz - l,  cx + w, cy - h, cz + l,  cx - w, cy - h, cz + l,
        # Right (+X)
        cx + w, cy - h, cz + l,  cx + w, cy - h, cz - l,  cx + w, cy + h, cz - l,  cx + w, cy + h, cz + l,
        # Left (-X)
        cx - w, cy - h, cz - l,  cx - w, cy - h, cz + l,  cx - w, cy + h, cz + l,  cx - w, cy + h, cz - l,
    ]
    
    normals = [
        # Front
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        # Back
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        # Top
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        # Bottom
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        # Right
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
        # Left
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ]
    
    indices = []
    for f in range(6):
        base = f * 4
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
        
    return positions, normals, indices

def create_cylinder(radius, length, segments=16, center_x=0.0, center_y=0.0, center_z=0.0, axis='z'):
    """Generates cylinder geometry along specified axis."""
    positions = []
    normals = []
    indices = []
    
    half_l = length / 2.0
    for i in range(segments):
        theta1 = (i / segments) * 2.0 * math.pi
        theta2 = ((i + 1) / segments) * 2.0 * math.pi
        
        c1, s1 = math.cos(theta1), math.sin(theta1)
        c2, s2 = math.cos(theta2), math.sin(theta2)
        
        if axis == 'z':
            # 4 vertices per quad
            v0 = [center_x + radius * c1, center_y + radius * s1, center_z - half_l]
            v1 = [center_x + radius * c2, center_y + radius * s2, center_z - half_l]
            v2 = [center_x + radius * c2, center_y + radius * s2, center_z + half_l]
            v3 = [center_x + radius * c1, center_y + radius * s1, center_z + half_l]
            n0 = [c1, s1, 0]
            n1 = [c2, s2, 0]
        elif axis == 'x':
            v0 = [center_x - half_l, center_y + radius * c1, center_z + radius * s1]
            v1 = [center_x - half_l, center_y + radius * c2, center_z + radius * s2]
            v2 = [center_x + half_l, center_y + radius * c2, center_z + radius * s2]
            v3 = [center_x + half_l, center_y + radius * c1, center_z + radius * s1]
            n0 = [0, c1, s1]
            n1 = [0, c2, s2]
        else: # 'y'
            v0 = [center_x + radius * c1, center_y - half_l, center_z + radius * s1]
            v1 = [center_x + radius * c2, center_y - half_l, center_z + radius * s2]
            v2 = [center_x + radius * c2, center_y + half_l, center_z + radius * s2]
            v3 = [center_x + radius * c1, center_y + half_l, center_z + radius * s1]
            n0 = [c1, 0, s1]
            n1 = [c2, 0, s2]
            
        base = len(positions) // 3
        positions.extend(v0 + v1 + v2 + v3)
        normals.extend(n0 + n1 + n1 + n0)
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
        
    return positions, normals, indices

def build_yh_express_glb():
    gltf = GLTF2()
    scene = Scene(nodes=[0])
    gltf.scenes.append(scene)
    gltf.scene = 0
    
    # Root train node
    root_node = Node(name="YH_EXPRESS_ROOT", children=[])
    gltf.nodes.append(root_node)
    
    # Materials matching reference
    mat_white = Material(
        name="Mat_Body_White",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.97, 0.98, 0.99, 1.0], metallicFactor=0.15, roughnessFactor=0.25)
    )
    mat_blue = Material(
        name="Mat_Livery_Blue",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.11, 0.31, 0.85, 1.0], metallicFactor=0.2, roughnessFactor=0.3)
    )
    mat_cyan_led = Material(
        name="Mat_Cyan_Halo",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.22, 0.74, 0.97, 1.0], metallicFactor=0.1, roughnessFactor=0.2),
        emissiveFactor=[0.22, 0.74, 0.97]
    )
    mat_dark_glass = Material(
        name="Mat_Dark_Glass",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.06, 0.09, 0.16, 1.0], metallicFactor=0.9, roughnessFactor=0.1)
    )
    mat_warm_interior = Material(
        name="Mat_Warm_Interior",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.99, 0.88, 0.54, 1.0], metallicFactor=0.1, roughnessFactor=0.3),
        emissiveFactor=[0.99, 0.88, 0.54]
    )
    mat_dark_metal = Material(
        name="Mat_Dark_Metal",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.12, 0.16, 0.23, 1.0], metallicFactor=0.85, roughnessFactor=0.5)
    )
    mat_steel_wheels = Material(
        name="Mat_Steel_Wheels",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.45, 0.5, 0.55, 1.0], metallicFactor=0.95, roughnessFactor=0.2)
    )
    mat_red_tail = Material(
        name="Mat_Red_Tail",
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=[0.93, 0.27, 0.27, 1.0], metallicFactor=0.1, roughnessFactor=0.2),
        emissiveFactor=[0.93, 0.27, 0.27]
    )
    
    gltf.materials.extend([
        mat_white, mat_blue, mat_cyan_led, mat_dark_glass,
        mat_warm_interior, mat_dark_metal, mat_steel_wheels, mat_red_tail
    ])
    
    # Binary buffer data
    bin_data = bytearray()
    
    def add_mesh_primitive(positions, normals, indices, material_idx):
        nonlocal bin_data
        
        # 1. Indices
        idx_bytes = struct.pack(f"<{len(indices)}H", *indices)
        idx_offset = len(bin_data)
        bin_data.extend(idx_bytes)
        # 4-byte padding
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
            
        bv_idx = BufferView(buffer=0, byteOffset=idx_offset, byteLength=len(idx_bytes), target=34963)
        gltf.bufferViews.append(bv_idx)
        bv_idx_num = len(gltf.bufferViews) - 1
        
        acc_idx = Accessor(
            bufferView=bv_idx_num, byteOffset=0,
            componentType=5123, # UNSIGNED_SHORT
            count=len(indices),
            type="SCALAR",
            max=[max(indices)], min=[min(indices)]
        )
        gltf.accessors.append(acc_idx)
        acc_idx_num = len(gltf.accessors) - 1
        
        # 2. Positions
        pos_bytes = struct.pack(f"<{len(positions)}f", *positions)
        pos_offset = len(bin_data)
        bin_data.extend(pos_bytes)
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
            
        bv_pos = BufferView(buffer=0, byteOffset=pos_offset, byteLength=len(pos_bytes), target=34962)
        gltf.bufferViews.append(bv_pos)
        bv_pos_num = len(gltf.bufferViews) - 1
        
        min_p = [min(positions[0::3]), min(positions[1::3]), min(positions[2::3])]
        max_p = [max(positions[0::3]), max(positions[1::3]), max(positions[2::3])]
        
        acc_pos = Accessor(
            bufferView=bv_pos_num, byteOffset=0,
            componentType=5126, # FLOAT
            count=len(positions) // 3,
            type="VEC3",
            max=max_p, min=min_p
        )
        gltf.accessors.append(acc_pos)
        acc_pos_num = len(gltf.accessors) - 1
        
        # 3. Normals
        norm_bytes = struct.pack(f"<{len(normals)}f", *normals)
        norm_offset = len(bin_data)
        bin_data.extend(norm_bytes)
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
            
        bv_norm = BufferView(buffer=0, byteOffset=norm_offset, byteLength=len(norm_bytes), target=34962)
        gltf.bufferViews.append(bv_norm)
        bv_norm_num = len(gltf.bufferViews) - 1
        
        acc_norm = Accessor(
            bufferView=bv_norm_num, byteOffset=0,
            componentType=5126, # FLOAT
            count=len(normals) // 3,
            type="VEC3"
        )
        gltf.accessors.append(acc_norm)
        acc_norm_num = len(gltf.accessors) - 1
        
        prim = Primitive(
            attributes=Attributes(POSITION=acc_pos_num, NORMAL=acc_norm_num),
            indices=acc_idx_num,
            material=material_idx
        )
        return prim

    # Build 4 Carriages: 01 YH Express Lead, 02 Learn, 03 Build, 04 Grow
    car_length = 3.6
    car_spacing = 0.45
    step_z = car_length + car_spacing
    
    for car_idx in range(4):
        is_lead = (car_idx == 0)
        is_rear = (car_idx == 3)
        z_pos = -car_idx * step_z
        
        car_node_idx = len(gltf.nodes)
        car_node = Node(name=f"Carriage_{car_idx:02d}", translation=[0, 0, z_pos], children=[])
        root_node.children.append(car_node_idx)
        gltf.nodes.append(car_node)
        
        primitives = []
        
        # 1. Main White Cabin Body Shell
        p, n, i = create_box(1.08, 0.74, car_length, 0, 0.48, 0)
        primitives.append(add_mesh_primitive(p, n, i, 0)) # Mat_Body_White
        
        # 2. Roof Curved Fairing
        p, n, i = create_cylinder(0.53, car_length, segments=16, center_x=0, center_y=0.85, center_z=0, axis='z')
        primitives.append(add_mesh_primitive(p, n, i, 0)) # Mat_Body_White
        
        # 3. Dynamic Blue Side Livery Bands
        p, n, i = create_box(1.10, 0.24, car_length, 0, 0.35, 0)
        primitives.append(add_mesh_primitive(p, n, i, 1)) # Mat_Livery_Blue
        
        # 4. Cyan Pinstripe
        p, n, i = create_box(1.11, 0.04, car_length, 0, 0.48, 0)
        primitives.append(add_mesh_primitive(p, n, i, 2)) # Mat_Cyan_Halo
        
        # 5. Panoramic Windows Strip (Dark Glass)
        p, n, i = create_box(1.11, 0.22, car_length - 0.7, 0, 0.64, 0)
        primitives.append(add_mesh_primitive(p, n, i, 3)) # Mat_Dark_Glass
        
        # 6. Warm Interior Cabin Glow
        p, n, i = create_box(1.02, 0.16, car_length - 0.8, 0, 0.64, 0)
        primitives.append(add_mesh_primitive(p, n, i, 4)) # Mat_Warm_Interior
        
        # 7. Roof HVAC Unit
        p, n, i = create_box(0.72, 0.12, 1.2, 0, 0.95, -0.4)
        primitives.append(add_mesh_primitive(p, n, i, 5)) # Mat_Dark_Metal
        
        # 8. Underbody Skirts
        p, n, i = create_box(0.96, 0.18, car_length - 0.2, 0, 0.08, 0)
        primitives.append(add_mesh_primitive(p, n, i, 5)) # Mat_Dark_Metal
        
        # 9. Bogies & Steel Wheels
        for bogie_z in [car_length * 0.32, -car_length * 0.32]:
            # Bogie frame
            p, n, i = create_box(0.82, 0.08, 0.82, 0, 0.04, bogie_z)
            primitives.append(add_mesh_primitive(p, n, i, 5))
            
            # Axles & Wheels
            for axle_z in [bogie_z + 0.28, bogie_z - 0.28]:
                p, n, i = create_cylinder(0.03, 0.95, segments=8, center_x=0, center_y=-0.04, center_z=axle_z, axis='x')
                primitives.append(add_mesh_primitive(p, n, i, 6)) # Mat_Steel_Wheels
                
                for wheel_x in [-0.52, 0.52]:
                    p, n, i = create_cylinder(0.135, 0.065, segments=16, center_x=wheel_x, center_y=-0.04, center_z=axle_z, axis='x')
                    primitives.append(add_mesh_primitive(p, n, i, 6)) # Mat_Steel_Wheels
                    
        # 10. Gangway Bellows between cars
        if not is_lead:
            p, n, i = create_box(0.84, 0.68, 0.42, 0, 0.48, car_length / 2 + 0.21)
            primitives.append(add_mesh_primitive(p, n, i, 5))
            
        # 11. Lead Locomotive Nose, Headlights & Pantograph
        if is_lead:
            # Bullet Nose Wedge
            p, n, i = create_box(0.98, 0.64, 0.9, 0, 0.38, car_length / 2 + 0.45)
            primitives.append(add_mesh_primitive(p, n, i, 0)) # Mat_Body_White
            
            # Nose Lower Blue Mask
            p, n, i = create_box(1.02, 0.26, 0.85, 0, 0.24, car_length / 2 + 0.42)
            primitives.append(add_mesh_primitive(p, n, i, 1)) # Mat_Livery_Blue
            
            # Cockpit Windshield (Dark Glass)
            p, n, i = create_box(0.82, 0.42, 0.5, 0, 0.62, car_length / 2 + 0.35)
            primitives.append(add_mesh_primitive(p, n, i, 3)) # Mat_Dark_Glass
            
            # Destination Sign (Cyan Glow)
            p, n, i = create_box(0.74, 0.09, 0.1, 0, 0.82, car_length / 2 + 0.38)
            primitives.append(add_mesh_primitive(p, n, i, 2)) # Mat_Cyan_Halo
            
            # Dual High-Beam Headlights with Cyan Halos
            for hl_x in [-0.34, 0.34]:
                p, n, i = create_box(0.14, 0.14, 0.15, hl_x, 0.36, car_length / 2 + 0.88)
                primitives.append(add_mesh_primitive(p, n, i, 2)) # Mat_Cyan_Halo
                
            # Electric Pantograph Frame
            p, n, i = create_box(0.04, 0.45, 0.45, 0, 1.15, -0.7)
            primitives.append(add_mesh_primitive(p, n, i, 5)) # Mat_Dark_Metal
            p, n, i = create_box(0.75, 0.03, 0.08, 0, 1.38, -0.55)
            primitives.append(add_mesh_primitive(p, n, i, 6)) # Steel Collector
            
        # 12. Rear Taillights
        if is_rear:
            for tl_x in [-0.42, 0.42]:
                p, n, i = create_box(0.04, 0.36, 0.06, tl_x, 0.48, -car_length / 2 - 0.02)
                primitives.append(add_mesh_primitive(p, n, i, 7)) # Mat_Red_Tail
                
        # Link mesh to node
        mesh_idx = len(gltf.meshes)
        gltf.meshes.append(Mesh(name=f"Mesh_{car_idx:02d}", primitives=primitives))
        car_node.mesh = mesh_idx

    # Finalize Buffer
    gltf.buffers.append(Buffer(byteLength=len(bin_data)))
    gltf.set_binary_blob(bytes(bin_data))
    
    # Save GLB
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
    os.makedirs(output_dir, exist_ok=True)
    glb_path = os.path.join(output_dir, "yh_express.glb")
    
    gltf.save_binary(glb_path)
    print(f"SUCCESS: Generated {glb_path} ({len(bin_data)} bytes)")

if __name__ == "__main__":
    build_yh_express_glb()
