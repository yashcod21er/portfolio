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

def export_draco_glb(root_obj, filepath):
    bpy.ops.object.select_all(action='DESELECT')
    def select_recursive(obj):
        obj.select_set(True)
        for c in obj.children:
            select_recursive(c)
    select_recursive(root_obj)

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
    )
    print(f"      -> Exported GLB to {filepath}")

def build_all_landmarks():
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
    blend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "design", "3d"))
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(blend_dir, exist_ok=True)

    # =========================================================================
    # 1. AISSMS COE ARCHITECTURAL LANDMARK
    # =========================================================================
    print("=" * 60)
    print("[1/3] Building AISSMS College Landmark...")
    reset_scene()
    scene = bpy.context.scene

    mat_brick = create_pbr_material("Mat_Brick_Red", (0.62, 0.22, 0.18, 1.0), metallic=0.05, roughness=0.85)
    mat_stone = create_pbr_material("Mat_Stone_White", (0.95, 0.94, 0.92, 1.0), metallic=0.08, roughness=0.45)
    mat_roof = create_pbr_material("Mat_Slate_Roof", (0.28, 0.33, 0.40, 1.0), metallic=0.15, roughness=0.60)
    mat_copper = create_pbr_material("Mat_Aged_Copper", (0.25, 0.55, 0.45, 1.0), metallic=0.35, roughness=0.40)
    mat_clock_face = create_pbr_material("Mat_Clock_Face", (1.0, 1.0, 0.95, 1.0), emission_color=(1.0, 1.0, 0.95, 1.0), emission_strength=2.5)

    aissms_root = bpy.data.objects.new("AISSMS_Landmark", None)
    scene.collection.objects.link(aissms_root)

    # Main Academic Hall Block
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    hall = bpy.context.active_object
    hall.name = "AISSMS_MainHall"
    hall.parent = aissms_root
    hall.scale = (5.8, 3.2, 2.2)
    hall.location = (0, 0, 1.1)
    hall.data.materials.append(mat_brick)

    # Pitched Hip Roof
    bpy.ops.mesh.primitive_cone_add(radius1=3.4, depth=1.2, vertices=4)
    roof = bpy.context.active_object
    roof.name = "AISSMS_Roof"
    roof.parent = aissms_root
    roof.rotation_euler = (0, 0, math.pi / 4)
    roof.scale = (1.4, 0.82, 1.0)
    roof.location = (0, 0, 2.8)
    roof.data.materials.append(mat_roof)

    # Front Classical Colonnade Entrance
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    portico = bpy.context.active_object
    portico.name = "AISSMS_Portico"
    portico.parent = aissms_root
    portico.scale = (2.6, 0.8, 1.8)
    portico.location = (0, 1.8, 0.9)
    portico.data.materials.append(mat_stone)

    # Central Iconic Clock Tower
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    tower = bpy.context.active_object
    tower.name = "AISSMS_ClockTower"
    tower.parent = aissms_root
    tower.scale = (1.5, 1.5, 3.8)
    tower.location = (0, 0.4, 3.5)
    tower.data.materials.append(mat_stone)

    # Clock Faces (4 sides)
    for c_rot, c_loc in [
        ((0, 0, 0), (0, 1.16, 4.4)),
        ((0, 0, math.pi), (0, -0.36, 4.4)),
        ((0, 0, math.pi / 2), (-0.76, 0.4, 4.4)),
        ((0, 0, -math.pi / 2), (0.76, 0.4, 4.4)),
    ]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.04, vertices=16)
        clock = bpy.context.active_object
        clock.name = "Clock_Face"
        clock.parent = tower
        clock.rotation_euler = (math.pi / 2, c_rot[1], c_rot[2])
        clock.location = c_loc
        clock.data.materials.append(mat_clock_face)

    # Tower Cupola & Dome
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.65, segments=16, ring_count=12)
    dome = bpy.context.active_object
    dome.name = "AISSMS_Dome"
    dome.parent = tower
    dome.location = (0, 0.4, 5.7)
    dome.data.materials.append(mat_copper)

    # Save .blend and export GLB
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, "aissms-landmark.blend"))
    export_draco_glb(aissms_root, os.path.join(models_dir, "aissms-landmark.glb"))

    # =========================================================================
    # 2. FULL-STACK CENTRAL TECHNOLOGY HUB ROTUNDA
    # =========================================================================
    print("=" * 60)
    print("[2/3] Building Full-Stack Central Technology Hub...")
    reset_scene()
    scene = bpy.context.scene

    mat_hub_white = create_pbr_material("Mat_Hub_White", (0.96, 0.97, 0.98, 1.0), metallic=0.08, roughness=0.20)
    mat_hub_glass = create_pbr_material("Mat_Hub_Glass", (0.10, 0.35, 0.75, 1.0), metallic=0.88, roughness=0.08)
    mat_cyan_ring = create_pbr_material("Mat_Cyan_Ring", (0.20, 0.85, 1.0, 1.0), emission_color=(0.20, 0.85, 1.0, 1.0), emission_strength=5.5)
    mat_dark_frame = create_pbr_material("Mat_Dark_Frame", (0.12, 0.14, 0.18, 1.0), metallic=0.85, roughness=0.3)

    hub_root = bpy.data.objects.new("FullStackHub", None)
    scene.collection.objects.link(hub_root)

    # Tier 0: Ground Plaza Podium
    bpy.ops.mesh.primitive_cylinder_add(radius=4.8, depth=0.4, vertices=32)
    podium = bpy.context.active_object
    podium.name = "Hub_Plaza"
    podium.parent = hub_root
    podium.location = (0, 0, 0.2)
    podium.data.materials.append(mat_hub_white)

    # Tier 1: Frontend Atrium (Hexagonal Glass Rotunda)
    bpy.ops.mesh.primitive_cylinder_add(radius=3.8, depth=1.8, vertices=8)
    t1 = bpy.context.active_object
    t1.name = "Hub_Tier_Frontend"
    t1.parent = hub_root
    t1.location = (0, 0, 1.3)
    t1.data.materials.append(mat_hub_glass)

    # Glowing Cyan Transition Ring 1
    bpy.ops.mesh.primitive_torus_add(major_radius=3.85, minor_radius=0.06, major_segments=32, minor_segments=8)
    r1 = bpy.context.active_object
    r1.name = "Hub_Ring_1"
    r1.parent = hub_root
    r1.location = (0, 0, 2.2)
    r1.data.materials.append(mat_cyan_ring)

    # Tier 2: Backend Architecture Floor
    bpy.ops.mesh.primitive_cylinder_add(radius=3.0, depth=1.6, vertices=8)
    t2 = bpy.context.active_object
    t2.name = "Hub_Tier_Backend"
    t2.parent = hub_root
    t2.location = (0, 0, 3.0)
    t2.data.materials.append(mat_hub_white)

    # Glowing Cyan Transition Ring 2
    bpy.ops.mesh.primitive_torus_add(major_radius=3.05, minor_radius=0.06, major_segments=32, minor_segments=8)
    r2 = bpy.context.active_object
    r2.name = "Hub_Ring_2"
    r2.parent = hub_root
    r2.location = (0, 0, 3.8)
    r2.data.materials.append(mat_cyan_ring)

    # Tier 3: Database & Cloud Core
    bpy.ops.mesh.primitive_cylinder_add(radius=2.2, depth=1.4, vertices=8)
    t3 = bpy.context.active_object
    t3.name = "Hub_Tier_Database"
    t3.parent = hub_root
    t3.location = (0, 0, 4.5)
    t3.data.materials.append(mat_hub_glass)

    # Tier 4: Crown Spire & Transmission Beacon
    bpy.ops.mesh.primitive_cone_add(radius1=0.8, depth=2.4, vertices=8)
    spire = bpy.context.active_object
    spire.name = "Hub_Spire"
    spire.parent = hub_root
    spire.location = (0, 0, 6.4)
    spire.data.materials.append(mat_dark_frame)

    # Beacon Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, segments=16, ring_count=12)
    beacon = bpy.context.active_object
    beacon.name = "Hub_Beacon"
    beacon.parent = hub_root
    beacon.location = (0, 0, 7.6)
    beacon.data.materials.append(mat_cyan_ring)

    # 4 Skybridge Portals (connecting the 4 directions)
    for rot_z in [0, math.pi / 2, math.pi, -math.pi / 2]:
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        bridge = bpy.context.active_object
        bridge.name = "Hub_Skybridge_Portal"
        bridge.parent = hub_root
        bridge.scale = (1.2, 2.2, 0.9)
        bridge.rotation_euler = (0, 0, rot_z)
        bx = 4.2 * math.sin(rot_z)
        by = 4.2 * math.cos(rot_z)
        bridge.location = (bx, by, 1.4)
        bridge.data.materials.append(mat_dark_frame)

    export_draco_glb(hub_root, os.path.join(models_dir, "fullstack-hub.glb"))

    # =========================================================================
    # 3. PROJECT DISPLAY SHOWCASE STANDS
    # =========================================================================
    print("=" * 60)
    print("[3/3] Building Project Display Showcases...")
    reset_scene()
    scene = bpy.context.scene

    mat_stand_slate = create_pbr_material("Mat_Stand_Slate", (0.16, 0.18, 0.22, 1.0), metallic=0.7, roughness=0.3)
    mat_screen_glass = create_pbr_material("Mat_Screen_Glass", (0.08, 0.12, 0.18, 1.0), metallic=0.9, roughness=0.08)
    mat_screen_glow = create_pbr_material("Mat_Screen_Glow", (0.25, 0.65, 1.0, 1.0), emission_color=(0.25, 0.65, 1.0, 1.0), emission_strength=4.0)

    proj_root = bpy.data.objects.new("ProjectDisplays", None)
    scene.collection.objects.link(proj_root)

    projects = [
        ("Display_Airbnb", -3.2, 0.0),
        ("Display_Spotify", -1.1, 0.5),
        ("Display_RecipeHub", 1.1, 0.5),
        ("Display_AI", 3.2, 0.0),
    ]

    for name, x_pos, y_pos in projects:
        # Base Kiosk Plinth
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        kiosk = bpy.context.active_object
        kiosk.name = f"{name}_Plinth"
        kiosk.parent = proj_root
        kiosk.scale = (1.2, 0.4, 0.6)
        kiosk.location = (x_pos, y_pos, 0.3)
        kiosk.data.materials.append(mat_stand_slate)

        # Angled Showcase Screen (Tablet Form)
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        screen = bpy.context.active_object
        screen.name = name
        screen.parent = proj_root
        screen.scale = (1.3, 0.08, 1.8)
        screen.rotation_euler = (-0.22, 0, 0)
        screen.location = (x_pos, y_pos, 1.5)
        screen.data.materials.append(mat_screen_glass)

        # Glowing Neon Bezel Edge
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        bezel = bpy.context.active_object
        bezel.name = f"{name}_Bezel"
        bezel.parent = screen
        bezel.scale = (1.02, 1.02, 1.02)
        bezel.location = (0, 0, 0)
        bezel.data.materials.append(mat_screen_glow)

    export_draco_glb(proj_root, os.path.join(models_dir, "project-displays.glb"))

    # Master city source project
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, "journey-city.blend"))
    print("=" * 60)
    print("COMPLETE: All 4 Hero 3D Models Built and Exported to public/models/!")
    print("=" * 60)

if __name__ == "__main__":
    build_all_landmarks()
