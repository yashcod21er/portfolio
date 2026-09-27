"""
Blender Python Automation Script: Generates the "YH EXPRESS" 3D Bullet Train
Based on reference asset specification: media_1789893916682.jpg
Exports production-ready GLB model directly to public/models/yh_express.glb
"""

import bpy
import bmesh
import math
import os

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
        
        if emission_color and emission_strength > 0:
            # Blender 4.x Principled BSDF emission inputs
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = emission_color
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = emission_color
    return mat

def build_yh_express():
    # 1. Reset Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # 2. Materials
    mat_white = create_pbr_material("Mat_Body_White", (0.96, 0.97, 0.98, 1.0), metallic=0.15, roughness=0.25)
    mat_blue = create_pbr_material("Mat_Body_Blue", (0.11, 0.31, 0.85, 1.0), metallic=0.2, roughness=0.3)
    mat_cyan_glow = create_pbr_material("Mat_Cyan_Glow", (0.22, 0.74, 0.97, 1.0), emission_color=(0.22, 0.74, 0.97, 1.0), emission_strength=5.0)
    mat_glass_dark = create_pbr_material("Mat_Dark_Glass", (0.06, 0.09, 0.16, 1.0), metallic=0.9, roughness=0.1)
    mat_warm_interior = create_pbr_material("Mat_Warm_Interior", (0.99, 0.88, 0.54, 1.0), emission_color=(0.99, 0.88, 0.54, 1.0), emission_strength=3.5)
    mat_metal_dark = create_pbr_material("Mat_Metal_Dark", (0.12, 0.16, 0.23, 1.0), metallic=0.85, roughness=0.45)
    mat_steel = create_pbr_material("Mat_Steel_Wheels", (0.45, 0.5, 0.55, 1.0), metallic=0.95, roughness=0.2)
    mat_red_tail = create_pbr_material("Mat_Red_Tail", (0.93, 0.27, 0.27, 1.0), emission_color=(0.93, 0.27, 0.27, 1.0), emission_strength=6.0)

    # Master train collection
    train_root = bpy.data.objects.new("YH_Express_Train", None)
    scene.collection.objects.link(train_root)

    car_length = 3.6
    car_spacing = 0.45
    u_offset = car_length + car_spacing

    def create_carriage(car_idx, is_lead=False, is_rear=False):
        car_name = f"Carriage_{car_idx:02d}"
        car_empty = bpy.data.objects.new(car_name, None)
        scene.collection.objects.link(car_empty)
        car_empty.parent = train_root
        car_empty.location.z = -car_idx * u_offset

        # A. Main Cabin Shell
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        body = bpy.context.active_object
        body.name = f"{car_name}_Body"
        body.parent = car_empty
        body.scale = (1.08, car_length, 0.74)
        body.location = (0, 0, 0.48)
        body.data.materials.append(mat_white)

        # B. Curved Roof
        bpy.ops.mesh.primitive_cylinder_add(radius=0.53, depth=car_length, vertices=24)
        roof = bpy.context.active_object
        roof.name = f"{car_name}_Roof"
        roof.parent = car_empty
        roof.rotation_euler = (math.pi / 2, 0, 0)
        roof.location = (0, 0, 0.85)
        roof.data.materials.append(mat_white)

        # C. Blue Livery Side Stripes
        for side in [-1, 1]:
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            stripe = bpy.context.active_object
            stripe.name = f"{car_name}_BlueStripe_{side}"
            stripe.parent = car_empty
            stripe.scale = (0.24, car_length, 1.0)
            stripe.rotation_euler = (0, math.pi / 2, 0) if side == 1 else (0, -math.pi / 2, 0)
            stripe.location = (side * 0.542, 0, 0.35)
            stripe.data.materials.append(mat_blue)

            # Cyan Pinstripe
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            pinstripe = bpy.context.active_object
            pinstripe.name = f"{car_name}_CyanStripe_{side}"
            pinstripe.parent = car_empty
            pinstripe.scale = (0.04, car_length, 1.0)
            pinstripe.rotation_euler = (0, math.pi / 2, 0) if side == 1 else (0, -math.pi / 2, 0)
            pinstripe.location = (side * 0.543, 0, 0.48)
            pinstripe.data.materials.append(mat_cyan_glow)

        # D. Panoramic Tinted Windows with Warm Interior Glow
        for side in [-1, 1]:
            # Dark Window Glass Strip
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            win_glass = bpy.context.active_object
            win_glass.name = f"{car_name}_WindowsGlass_{side}"
            win_glass.parent = car_empty
            win_glass.scale = (0.22, car_length - 0.6, 1.0)
            win_glass.rotation_euler = (0, math.pi / 2, 0) if side == 1 else (0, -math.pi / 2, 0)
            win_glass.location = (side * 0.543, 0, 0.64)
            win_glass.data.materials.append(mat_glass_dark)

            # Warm Interior Lighting Backplate
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            win_glow = bpy.context.active_object
            win_glow.name = f"{car_name}_WindowsGlow_{side}"
            win_glow.parent = car_empty
            win_glow.scale = (0.16, car_length - 0.7, 1.0)
            win_glow.rotation_euler = (0, math.pi / 2, 0) if side == 1 else (0, -math.pi / 2, 0)
            win_glow.location = (side * 0.544, 0, 0.64)
            win_glow.data.materials.append(mat_warm_interior)

        # E. Roof HVAC Unit
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        hvac = bpy.context.active_object
        hvac.name = f"{car_name}_HVAC"
        hvac.parent = car_empty
        hvac.scale = (0.7, 1.2, 0.12)
        hvac.location = (0, -0.4, 0.95)
        hvac.data.materials.append(mat_metal_dark)

        # F. Lead Locomotive Features
        if is_lead:
            # 1. Aerodynamic Bullet Nose Shell
            bpy.ops.mesh.primitive_cone_add(radius1=0.54, radius2=0.12, depth=0.95, vertices=24)
            nose = bpy.context.active_object
            nose.name = "Locomotive_Nose"
            nose.parent = car_empty
            nose.rotation_euler = (-math.pi / 2, 0, 0)
            nose.location = (0, car_length / 2 + 0.45, 0.42)
            nose.data.materials.append(mat_white)

            # 2. Lower Blue Chevron Band
            bpy.ops.mesh.primitive_cone_add(radius1=0.55, radius2=0.14, depth=0.6, vertices=24)
            nose_blue = bpy.context.active_object
            nose_blue.name = "Locomotive_NoseBlue"
            nose_blue.parent = car_empty
            nose_blue.rotation_euler = (-math.pi / 2, 0, 0)
            nose_blue.location = (0, car_length / 2 + 0.4, 0.3)
            nose_blue.data.materials.append(mat_blue)

            # 3. Cockpit Wraparound Windshield
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            windshield = bpy.context.active_object
            windshield.name = "Locomotive_Windshield"
            windshield.parent = car_empty
            windshield.scale = (0.82, 0.52, 1.0)
            windshield.rotation_euler = (-math.pi / 4.4, 0, 0)
            windshield.location = (0, car_length / 2 + 0.35, 0.68)
            windshield.data.materials.append(mat_glass_dark)

            # 4. LED Destination Display Screen: "NEXT STOP: A BRIGHTER TOMORROW"
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            dest_screen = bpy.context.active_object
            dest_screen.name = "Locomotive_DestinationScreen"
            dest_screen.parent = car_empty
            dest_screen.scale = (0.72, 0.09, 1.0)
            dest_screen.rotation_euler = (-math.pi / 4.4, 0, 0)
            dest_screen.location = (0, car_length / 2 + 0.33, 0.85)
            dest_screen.data.materials.append(mat_cyan_glow)

            # 5. Dual High-Beam Projector Headlights with Cyan Halos
            for side in [-1, 1]:
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, segments=16, ring_count=16)
                headlight = bpy.context.active_object
                headlight.name = f"Headlight_{side}"
                headlight.parent = car_empty
                headlight.location = (side * 0.34, car_length / 2 + 0.82, 0.38)
                headlight.data.materials.append(mat_cyan_glow)

                # Cyan LED Contour Halo Blade
                bpy.ops.mesh.primitive_plane_add(size=1.0)
                halo = bpy.context.active_object
                halo.name = f"HeadlightHalo_{side}"
                halo.parent = car_empty
                halo.scale = (0.035, 0.16, 1.0)
                halo.rotation_euler = (0, 0, side * 0.6)
                halo.location = (side * 0.38, car_length / 2 + 0.84, 0.44)
                halo.data.materials.append(mat_cyan_glow)

            # 6. Electric High-Speed Pantograph
            panto = bpy.data.objects.new("Pantograph", None)
            scene.collection.objects.link(panto)
            panto.parent = car_empty
            panto.location = (0, -0.7, 0.98)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.45, vertices=8)
            panto_arm1 = bpy.context.active_object
            panto_arm1.name = "Panto_ArmLower"
            panto_arm1.parent = panto
            panto_arm1.rotation_euler = (0.6, 0, 0)
            panto_arm1.location = (0, -0.15, 0.22)
            panto_arm1.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.018, depth=0.48, vertices=8)
            panto_arm2 = bpy.context.active_object
            panto_arm2.name = "Panto_ArmUpper"
            panto_arm2.parent = panto
            panto_arm2.rotation_euler = (-0.7, 0, 0)
            panto_arm2.location = (0, 0.05, 0.48)
            panto_arm2.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cube_add(size=1.0)
            collector = bpy.context.active_object
            collector.name = "Panto_Collector"
            collector.parent = panto
            collector.scale = (0.75, 0.08, 0.03)
            collector.location = (0, 0.2, 0.65)
            collector.data.materials.append(mat_steel)

        # G. Rear Carriage Features
        if is_rear:
            for side in [-1, 1]:
                bpy.ops.mesh.primitive_plane_add(size=1.0)
                taillight = bpy.context.active_object
                taillight.name = f"Taillight_{side}"
                taillight.parent = car_empty
                taillight.scale = (0.04, 0.36, 1.0)
                taillight.rotation_euler = (0, math.pi, 0)
                taillight.location = (side * 0.42, -car_length / 2 - 0.01, 0.48)
                taillight.data.materials.append(mat_red_tail)

        # H. Underbody Bogies with Steel Rail Wheels
        for bogie_pos in [car_length * 0.32, -car_length * 0.32]:
            bogie = bpy.data.objects.new(f"{car_name}_Bogie_{bogie_pos:.1f}", None)
            scene.collection.objects.link(bogie)
            bogie.parent = car_empty
            bogie.location = (0, bogie_pos, 0.06)

            # Subframe
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            frame = bpy.context.active_object
            frame.name = "Bogie_Frame"
            frame.parent = bogie
            frame.scale = (0.82, 0.82, 0.08)
            frame.location = (0, 0, 0)
            frame.data.materials.append(mat_metal_dark)

            # Axles & Wheels
            for axle_y in [0.28, -0.28]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.95, vertices=8)
                axle = bpy.context.active_object
                axle.name = "Axle"
                axle.parent = bogie
                axle.rotation_euler = (0, math.pi / 2, 0)
                axle.location = (0, axle_y, -0.04)
                axle.data.materials.append(mat_steel)

                for wheel_x in [-0.52, 0.52]:
                    bpy.ops.mesh.primitive_cylinder_add(radius=0.135, depth=0.065, vertices=20)
                    wheel = bpy.context.active_object
                    wheel.name = "Wheel"
                    wheel.parent = bogie
                    wheel.rotation_euler = (0, math.pi / 2, 0)
                    wheel.location = (wheel_x, axle_y, -0.04)
                    wheel.data.materials.append(mat_steel)

        # I. Gangway Bellows between cars
        if not is_lead:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            gangway = bpy.context.active_object
            gangway.name = f"{car_name}_Gangway"
            gangway.parent = car_empty
            gangway.scale = (0.84, 0.42, 0.68)
            gangway.location = (0, car_length / 2 + 0.22, 0.48)
            gangway.data.materials.append(mat_metal_dark)

        return car_empty

    # Build the 4-car YH Express train
    create_carriage(0, is_lead=True, is_rear=False)   # 01 YH EXPRESS Lead
    create_carriage(1, is_lead=False, is_rear=False)  # 02 LEARN
    create_carriage(2, is_lead=False, is_rear=False)  # 03 BUILD
    create_carriage(3, is_lead=False, is_rear=True)   # 04 GROW Rear

    # 3. Export GLB
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
    os.makedirs(output_dir, exist_ok=True)
    glb_path = os.path.join(output_dir, "yh_express.glb")

    print(f"Exporting YH EXPRESS to {glb_path}...")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT'
    )
    print(f"Successfully generated {glb_path}!")

if __name__ == "__main__":
    build_yh_express()
