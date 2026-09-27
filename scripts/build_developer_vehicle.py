import bpy
import bmesh
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        if emission_color and emission_strength > 0:
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = emission_color
                bsdf.inputs['Emission Strength'].default_value = emission_strength
    return mat

def build_vehicle():
    print("=" * 60)
    print("Building Developer Vehicle (Blender 4.2 LTS)...")
    print("=" * 60)
    reset_scene()
    scene = bpy.context.scene

    # Materials
    mat_body_white = create_pbr_material("Mat_Vehicle_White", (0.97, 0.98, 0.99, 1.0), metallic=0.05, roughness=0.18)
    mat_accent_blue = create_pbr_material("Mat_Vehicle_Blue", (0.14, 0.38, 0.92, 1.0), metallic=0.2, roughness=0.25)
    mat_glass = create_pbr_material("Mat_Vehicle_Glass", (0.05, 0.08, 0.12, 1.0), metallic=0.92, roughness=0.06)
    mat_wheel_rubber = create_pbr_material("Mat_Wheel_Rubber", (0.10, 0.11, 0.13, 1.0), metallic=0.1, roughness=0.7)
    mat_wheel_alloy = create_pbr_material("Mat_Wheel_Alloy", (0.75, 0.80, 0.85, 1.0), metallic=0.9, roughness=0.18)
    mat_headlight_cyan = create_pbr_material("Mat_Light_Cyan", (0.22, 0.87, 1.0, 1.0), emission_color=(0.22, 0.87, 1.0, 1.0), emission_strength=5.0)
    mat_taillight_red = create_pbr_material("Mat_Light_Red", (1.0, 0.12, 0.12, 1.0), emission_color=(1.0, 0.12, 0.12, 1.0), emission_strength=6.0)

    # Master Root
    root = bpy.data.objects.new("DeveloperVehicle", None)
    scene.collection.objects.link(root)

    # Dimensions
    v_len = 2.20
    v_width = 1.08
    v_height = 0.72

    # 1. Aerodynamic Main Body Shell
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    body = bpy.context.active_object
    body.name = "VehicleBody"
    body.parent = root
    body.scale = (v_width, v_len, v_height * 0.6)
    body.location = (0, 0, 0.36)
    body.data.materials.append(mat_body_white)

    # Bevel modifier for rounded automotive edges
    bev = body.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = 0.18
    bev.segments = 3

    # 2. Lower Aero Skirt in Royal Blue
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    skirt = bpy.context.active_object
    skirt.name = "VehicleSkirt"
    skirt.parent = root
    skirt.scale = (v_width * 0.98, v_len * 0.98, 0.10)
    skirt.location = (0, 0, 0.14)
    skirt.data.materials.append(mat_accent_blue)

    # 3. Wraparound Panoramic Glass Canopy
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    canopy = bpy.context.active_object
    canopy.name = "VehicleGlass"
    canopy.parent = root
    canopy.scale = (v_width * 0.84, v_len * 0.65, v_height * 0.50)
    canopy.location = (0, -0.05, 0.65)
    canopy.data.materials.append(mat_glass)
    bev_c = canopy.modifiers.new(name="Bevel", type='BEVEL')
    bev_c.width = 0.12
    bev_c.segments = 3

    # 4. Roof Autonomous Sensor Puck (LiDAR dome)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.06, vertices=16)
    lidar = bpy.context.active_object
    lidar.name = "VehicleLiDAR"
    lidar.parent = root
    lidar.location = (0, 0, 0.92)
    lidar.data.materials.append(mat_accent_blue)

    # 5. Dual Cyan LED Headlights (Front is +Y)
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        hl = bpy.context.active_object
        hl.name = f"Headlight_{'R' if side == 1 else 'L'}"
        hl.parent = root
        hl.scale = (0.18, 0.04, 0.06)
        hl.location = (side * 0.38, v_len / 2 + 0.005, 0.36)
        hl.data.materials.append(mat_headlight_cyan)

    # 6. Continuous Red Rear Lightbar (Rear is -Y)
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    rl = bpy.context.active_object
    rl.name = "VehicleLights_Rear"
    rl.parent = root
    rl.scale = (v_width * 0.78, 0.03, 0.05)
    rl.location = (0, -v_len / 2 - 0.005, 0.40)
    rl.data.materials.append(mat_taillight_red)

    # 7. Four Aerodynamic Wheels (Wheel radius = 0.20, width = 0.12)
    wheel_y_offsets = [('F', v_len / 2 - 0.45), ('R', -v_len / 2 + 0.45)]
    wheel_x_offsets = [('L', -v_width / 2 - 0.02), ('R', v_width / 2 + 0.02)]

    for y_label, y_pos in wheel_y_offsets:
        for x_label, x_pos in wheel_x_offsets:
            wheel_name = f"Wheel_{y_label}{x_label}"
            
            # Wheel tire cylinder (revolving around X axis)
            bpy.ops.mesh.primitive_cylinder_add(radius=0.20, depth=0.10, vertices=18)
            wheel = bpy.context.active_object
            wheel.name = wheel_name
            wheel.parent = root
            wheel.rotation_euler = (0, math.pi / 2, 0)
            wheel.location = (x_pos, y_pos, 0.20)
            wheel.data.materials.append(mat_wheel_rubber)

            # Wheel alloy aero cap
            bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.105, vertices=12)
            cap = bpy.context.active_object
            cap.name = f"{wheel_name}_AlloyCap"
            cap.parent = wheel
            cap.location = (0, 0, 0)
            cap.data.materials.append(mat_wheel_alloy)

    # Save .blend in design/3d/
    blend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "design", "3d"))
    os.makedirs(blend_dir, exist_ok=True)
    blend_path = os.path.join(blend_dir, "developer-vehicle.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"-> Saved source project to {blend_path}")

    # Export optimized Draco GLB to public/models/
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
    os.makedirs(models_dir, exist_ok=True)
    glb_path = os.path.join(models_dir, "developer-vehicle.glb")

    # Select only vehicle hierarchy
    bpy.ops.object.select_all(action='DESELECT')
    def select_recursive(obj):
        obj.select_set(True)
        for c in obj.children:
            select_recursive(c)
    select_recursive(root)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
    )
    print(f"-> Exported Draco GLB to {glb_path}")
    print("=" * 60)

if __name__ == "__main__":
    build_vehicle()
