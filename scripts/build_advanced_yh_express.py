"""
Advanced Blender 4.2 LTS Automation Script: YH EXPRESS 3D Train Asset
Studio-Grade Aerodynamic Shinkansen/Velaro EMU Train Model

STANDARD BLENDER COORDINATE SPACE:
  - Up: +Z (Vertical elevation)
  - Forward: +Y (Nose points along +Y, carriages trail along -Y)
  - Right: +X (Carriage width)

Features:
  - Sculpted aerodynamic bullet nose with flush cockpit canopy, dual wipers, and chin spoiler
  - Emissive electronic destination matrix: "NEXT STOP: A BRIGHTER TOMORROW ->"
  - Front nose badge: "YH EXPRESS" with "BUILD · LEARN · CREATE"
  - Angled cyan LED running lights (DRL fangs) + recessed dual projector headlights
  - 3D Typographic livery system:
      * Carriage 00: "01", "YH EXPRESS", "IDEAS IN MOTION"
      * Carriage 01: "02", "LEARN"
      * Carriage 02: "03", "BUILD"
      * Carriage 03: "04", "GROW", Rear "YH", "KEEP BUILDING ->"
  - Panoramic recessed windows with warm amber cabin glow & passenger seats
  - Streamlined roof HVAC pods with cooling grilles
  - High-speed articulated scissor pantograph with ceramic insulators & collector horns
  - 2-axle bogie trucks with flanged steel wheels, air springs & aerodynamic side skirts
  - Vertical glowing red LED taillights
  - Complete railway tracks underneath train (dual rails, ballast bed, sleepers)
  - 3-point studio lighting rig and Hero isometric presentation camera
  - Defaults 3D viewport to Material Preview mode

Exports 4 formats:
  - public/models/yh_express.blend
  - public/models/yh_express.glb
  - public/models/yh_express.fbx
  - public/models/yh_express.obj
  - public/models/yh_express_render.png (High-Res Verification Render)
"""

import bpy
import bmesh
import math
import os

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

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
            if 'Emission Color' in bsdf.inputs:
                bsdf.inputs['Emission Color'].default_value = emission_color
                bsdf.inputs['Emission Strength'].default_value = emission_strength
            elif 'Emission' in bsdf.inputs:
                bsdf.inputs['Emission'].default_value = emission_color
    return mat

def create_3d_text_mesh(name, text, size=0.12, extrude=0.012, mat=None, rot=(0, 0, 0), loc=(0, 0, 0)):
    """Creates a 3D vector text object and converts it to a clean mesh for export."""
    curve = bpy.data.curves.new(name=f"{name}_Curve", type='FONT')
    curve.body = text
    curve.size = size
    curve.extrude = extrude
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.rotation_euler = rot
    obj.location = loc
    
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    
    if mat:
        obj.data.materials.append(mat)
    return obj

def create_flanged_wheel_mesh(name, mat_steel):
    """Creates a high-precision railway wheel revolving around the X axis."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    
    segments = 24
    r_hub = 0.05
    r_tread = 0.138
    r_flange = 0.158
    w_tread = 0.052
    w_flange = 0.016
    
    profile = [
        (r_hub, -w_tread / 2),
        (r_hub * 1.3, -w_tread / 2),
        (r_tread * 0.72, -w_tread / 4),
        (r_tread, -w_tread / 2),
        (r_tread, w_tread / 2),
        (r_flange, w_tread / 2),
        (r_flange, w_tread / 2 + w_flange),
        (r_tread * 0.85, w_tread / 2 + w_flange),
        (r_hub, w_tread / 2 + w_flange)
    ]
    
    rings = []
    for r, x in profile:
        ring = []
        for s in range(segments):
            angle = (s / segments) * 2 * math.pi
            y = r * math.cos(angle)
            z = r * math.sin(angle)
            v = bm.verts.new((x, y, z))
            ring.append(v)
        rings.append(ring)
        
    for i in range(len(rings) - 1):
        r1 = rings[i]
        r2 = rings[i + 1]
        for s in range(segments):
            s_next = (s + 1) % segments
            bm.faces.new([r1[s], r2[s], r2[s_next], r1[s_next]])
            
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat_steel)
    return obj

def create_passenger_door(name, side, y_pos, car_width, mat_frame, mat_panel, mat_glass, mat_handle):
    """Creates a distinct, animatable passenger boarding door with frame, window, and handle."""
    door_empty = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(door_empty)
    door_empty.location = (side * (car_width / 2 + 0.007), y_pos, 0.42)
    
    # Door Panel
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    panel = bpy.context.active_object
    panel.name = f"{name}_Panel"
    panel.parent = door_empty
    panel.scale = (0.015, 0.28, 0.52)
    panel.location = (0, 0, 0)
    panel.data.materials.append(mat_panel)
    
    # Door Frame / Rubber Gasket Seam
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    frame = bpy.context.active_object
    frame.name = f"{name}_Frame"
    frame.parent = door_empty
    frame.scale = (0.012, 0.30, 0.54)
    frame.location = (-side * 0.002, 0, 0)
    frame.data.materials.append(mat_frame)
    
    # Door Window (Upper section)
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    win = bpy.context.active_object
    win.name = f"{name}_Window"
    win.parent = door_empty
    win.scale = (0.018, 0.16, 0.22)
    win.location = (0, 0, 0.11)
    win.data.materials.append(mat_glass)
    
    # Vertical Grab Handle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.18, vertices=8)
    handle = bpy.context.active_object
    handle.name = f"{name}_Handle"
    handle.parent = door_empty
    handle.location = (side * 0.012, side * -0.09, -0.04)
    handle.data.materials.append(mat_handle)
    
    return door_empty

def build_advanced_yh_express():
    print("=" * 70)
    print("Starting Studio-Grade YH EXPRESS Build (Blender 4.2 LTS Standard Space)...")
    print("=" * 70)
    reset_scene()
    scene = bpy.context.scene

    # 1. PBR Materials System (Matching Blueprint Reference)
    mat_white = create_pbr_material("Mat_Body_White", (0.96, 0.97, 0.98, 1.0), metallic=0.08, roughness=0.18)
    mat_blue = create_pbr_material("Mat_Livery_Blue", (0.08, 0.28, 0.88, 1.0), metallic=0.15, roughness=0.22)
    mat_cyan_halo = create_pbr_material("Mat_Cyan_Halo", (0.15, 0.80, 1.0, 1.0), emission_color=(0.15, 0.80, 1.0, 1.0), emission_strength=6.0)
    mat_dark_glass = create_pbr_material("Mat_Dark_Glass", (0.03, 0.05, 0.08, 1.0), metallic=0.92, roughness=0.06)
    mat_warm_interior = create_pbr_material("Mat_Warm_Interior", (1.0, 0.88, 0.55, 1.0), emission_color=(1.0, 0.88, 0.55, 1.0), emission_strength=3.8)
    mat_metal_dark = create_pbr_material("Mat_Machinery_Dark", (0.12, 0.14, 0.18, 1.0), metallic=0.82, roughness=0.38)
    mat_steel = create_pbr_material("Mat_Steel_Wheels", (0.65, 0.70, 0.75, 1.0), metallic=0.96, roughness=0.15)
    mat_red_tail = create_pbr_material("Mat_Red_Tail", (1.0, 0.15, 0.15, 1.0), emission_color=(1.0, 0.15, 0.15, 1.0), emission_strength=7.0)
    mat_text_dark = create_pbr_material("Mat_Text_Dark", (0.08, 0.10, 0.14, 1.0), metallic=0.10, roughness=0.30)
    mat_text_blue = create_pbr_material("Mat_Text_Blue", (0.08, 0.28, 0.88, 1.0), metallic=0.10, roughness=0.25)
    mat_ballast = create_pbr_material("Mat_Ballast", (0.16, 0.18, 0.22, 1.0), metallic=0.05, roughness=0.92)
    mat_sleeper = create_pbr_material("Mat_Sleeper", (0.32, 0.33, 0.35, 1.0), metallic=0.10, roughness=0.75)

    # Master Root Train Object
    train_root = bpy.data.objects.new("YH_Express_Train", None)
    scene.collection.objects.link(train_root)

    car_length = 3.60
    car_width = 1.08
    car_height = 0.74
    car_spacing = 0.42
    u_offset = car_length + car_spacing

    def build_carriage(car_idx, is_lead=False, is_rear=False):
        car_name = f"Carriage_{car_idx:02d}"
        car_empty = bpy.data.objects.new(car_name, None)
        scene.collection.objects.link(car_empty)
        car_empty.parent = train_root
        car_empty.location.y = -car_idx * u_offset

        print(f"-> Assembling {car_name} (Lead: {is_lead}, Rear: {is_rear})...")

        # =========================================================================
        # 1. SCULPTED CARRIAGE BODY (Lofted Quad Tumblehome Profile in X-Z plane, extruded along Y)
        # =========================================================================
        body_mesh = bpy.data.meshes.new(f"{car_name}_BodyMesh")
        bm = bmesh.new()

        num_roof_pts = 14
        profile_pts = []
        # Bottom underbody sill (x, z)
        profile_pts.append((-car_width / 2 + 0.08, 0.12))
        profile_pts.append((car_width / 2 - 0.08, 0.12))
        # Lower side walls
        profile_pts.append((car_width / 2, 0.22))
        profile_pts.append((car_width / 2, 0.58))
        # Rounded roof cantrail arc
        r_roof = car_width / 2
        z_roof_center = 0.58
        for i in range(num_roof_pts + 1):
            theta = (i / num_roof_pts) * math.pi
            x = r_roof * math.cos(theta)
            z = z_roof_center + (r_roof * 0.48) * math.sin(theta)
            profile_pts.append((x, z))
        # Left side walls
        profile_pts.append((-car_width / 2, 0.58))
        profile_pts.append((-car_width / 2, 0.22))

        # Extrude along Y axis
        y_slices = [-car_length / 2, -car_length * 0.35, -car_length * 0.15, car_length * 0.15, car_length * 0.35, car_length / 2]
        rings = []
        for y in y_slices:
            ring = []
            for px, pz in profile_pts:
                v = bm.verts.new((px, y, pz))
                ring.append(v)
            rings.append(ring)

        for i in range(len(rings) - 1):
            r1 = rings[i]
            r2 = rings[i + 1]
            for p in range(len(profile_pts)):
                p_next = (p + 1) % len(profile_pts)
                bm.faces.new([r1[p], r2[p], r2[p_next], r1[p_next]])

        if not is_rear:
            bm.faces.new([rings[0][p] for p in range(len(profile_pts))])
        if not is_lead:
            bm.faces.new([rings[-1][len(profile_pts) - 1 - p] for p in range(len(profile_pts))])

        bm.to_mesh(body_mesh)
        bm.free()

        body_obj = bpy.data.objects.new(f"{car_name}_Body", body_mesh)
        scene.collection.objects.link(body_obj)
        body_obj.parent = car_empty
        body_obj.data.materials.append(mat_white)

        bev = body_obj.modifiers.new(name="Bevel", type='BEVEL')
        bev.width = 0.018
        bev.segments = 2
        for f in body_obj.data.polygons:
            f.use_smooth = True

        # =========================================================================
        # 2. DYNAMIC ROYAL BLUE LIVERY SWEEP & ROOFLINE ACCENTS
        # =========================================================================
        for side in [-1, 1]:
            # Lower Royal Blue Dynamic Stripe
            stripe_mesh = bpy.data.meshes.new(f"{car_name}_LiveryBlue_{side}")
            bm_s = bmesh.new()
            v1 = bm_s.verts.new((side * (car_width / 2 + 0.005), -car_length / 2, 0.20))
            v2 = bm_s.verts.new((side * (car_width / 2 + 0.005), car_length / 2, 0.20))
            v3 = bm_s.verts.new((side * (car_width / 2 + 0.005), car_length / 2, 0.42))
            v4 = bm_s.verts.new((side * (car_width / 2 + 0.005), -car_length / 2, 0.42))
            bm_s.faces.new([v1, v2, v3, v4] if side == 1 else [v4, v3, v2, v1])
            bm_s.to_mesh(stripe_mesh)
            bm_s.free()

            stripe_obj = bpy.data.objects.new(f"{car_name}_LiveryBlue_{side}", stripe_mesh)
            scene.collection.objects.link(stripe_obj)
            stripe_obj.parent = car_empty
            stripe_obj.data.materials.append(mat_blue)

            # Fine Cyan Pinstripe Accent
            pin_mesh = bpy.data.meshes.new(f"{car_name}_CyanPin_{side}")
            bm_p = bmesh.new()
            pv1 = bm_p.verts.new((side * (car_width / 2 + 0.006), -car_length / 2, 0.43))
            pv2 = bm_p.verts.new((side * (car_width / 2 + 0.006), car_length / 2, 0.43))
            pv3 = bm_p.verts.new((side * (car_width / 2 + 0.006), car_length / 2, 0.455))
            pv4 = bm_p.verts.new((side * (car_width / 2 + 0.006), -car_length / 2, 0.455))
            bm_p.faces.new([pv1, pv2, pv3, pv4] if side == 1 else [pv4, pv3, pv2, pv1])
            bm_p.to_mesh(pin_mesh)
            bm_p.free()

            pin_obj = bpy.data.objects.new(f"{car_name}_CyanPin_{side}", pin_mesh)
            scene.collection.objects.link(pin_obj)
            pin_obj.parent = car_empty
            pin_obj.data.materials.append(mat_cyan_halo)

            # Roofline Blue Accent Stripe
            roof_mesh = bpy.data.meshes.new(f"{car_name}_RoofStripe_{side}")
            bm_r = bmesh.new()
            rv1 = bm_r.verts.new((side * (car_width / 2 - 0.04), -car_length / 2, 0.76))
            rv2 = bm_r.verts.new((side * (car_width / 2 - 0.04), car_length / 2, 0.76))
            rv3 = bm_r.verts.new((side * (car_width / 2 - 0.08), car_length / 2, 0.81))
            rv4 = bm_r.verts.new((side * (car_width / 2 - 0.08), -car_length / 2, 0.81))
            bm_r.faces.new([rv1, rv2, rv3, rv4] if side == 1 else [rv4, rv3, rv2, rv1])
            bm_r.to_mesh(roof_mesh)
            bm_r.free()

            roof_obj = bpy.data.objects.new(f"{car_name}_RoofStripe_{side}", roof_mesh)
            scene.collection.objects.link(roof_obj)
            roof_obj.parent = car_empty
            roof_obj.data.materials.append(mat_blue)

        # =========================================================================
        # 3. RECESSED PANORAMIC WINDOWS WITH WARM AMBER CABIN GLOW & SEATS
        # =========================================================================
        for side in [-1, 1]:
            # Continuous Dark Window Tint Glass Ribbon
            w_mesh = bpy.data.meshes.new(f"{car_name}_WinGlass_{side}")
            bm_w = bmesh.new()
            wv1 = bm_w.verts.new((side * (car_width / 2 + 0.006), -car_length / 2 + 0.32, 0.50))
            wv2 = bm_w.verts.new((side * (car_width / 2 + 0.006), car_length / 2 - 0.32, 0.50))
            wv3 = bm_w.verts.new((side * (car_width / 2 + 0.006), car_length / 2 - 0.32, 0.71))
            wv4 = bm_w.verts.new((side * (car_width / 2 + 0.006), -car_length / 2 + 0.32, 0.71))
            bm_w.faces.new([wv1, wv2, wv3, wv4] if side == 1 else [wv4, wv3, wv2, wv1])
            bm_w.to_mesh(w_mesh)
            bm_w.free()

            w_obj = bpy.data.objects.new(f"{car_name}_WinGlass_{side}", w_mesh)
            scene.collection.objects.link(w_obj)
            w_obj.parent = car_empty
            w_obj.data.materials.append(mat_dark_glass)

            # Warm Passenger Cabin Backplate
            glow_mesh = bpy.data.meshes.new(f"{car_name}_WinGlow_{side}")
            bm_g = bmesh.new()
            gv1 = bm_g.verts.new((side * (car_width / 2 + 0.007), -car_length / 2 + 0.40, 0.52))
            gv2 = bm_g.verts.new((side * (car_width / 2 + 0.007), car_length / 2 - 0.40, 0.52))
            gv3 = bm_g.verts.new((side * (car_width / 2 + 0.007), car_length / 2 - 0.40, 0.69))
            gv4 = bm_g.verts.new((side * (car_width / 2 + 0.007), -car_length / 2 + 0.40, 0.69))
            bm_g.faces.new([gv1, gv2, gv3, gv4] if side == 1 else [gv4, gv3, gv2, gv1])
            bm_g.to_mesh(glow_mesh)
            bm_g.free()

            glow_obj = bpy.data.objects.new(f"{car_name}_WinGlow_{side}", glow_mesh)
            scene.collection.objects.link(glow_obj)
            glow_obj.parent = car_empty
            glow_obj.data.materials.append(mat_warm_interior)

            # High-Speed Train Passenger Seats (Visible through windows)
            for seat_y in [-1.2, -0.6, 0.0, 0.6, 1.2]:
                bpy.ops.mesh.primitive_cube_add(size=1.0)
                seat = bpy.context.active_object
                seat.name = f"{car_name}_Seat_{side}_{seat_y}"
                seat.parent = car_empty
                seat.scale = (0.018, 0.14, 0.11)
                seat.location = (side * (car_width / 2 + 0.008), seat_y, 0.60)
                seat.data.materials.append(mat_metal_dark)

        # =========================================================================
        # 3B. PASSENGER BOARDING DOORS (Separate animatable objects)
        # =========================================================================
        for side in [-1, 1]:
            side_name = "Right" if side == 1 else "Left"
            door_front = create_passenger_door(
                name=f"{car_name}_Door_Front_{side_name}",
                side=side,
                y_pos=car_length / 2 - 0.45 if not is_lead else car_length / 2 - 0.30,
                car_width=car_width,
                mat_frame=mat_metal_dark,
                mat_panel=mat_white,
                mat_glass=mat_dark_glass,
                mat_handle=mat_cyan_halo
            )
            door_front.parent = car_empty

            if not is_lead:
                door_rear = create_passenger_door(
                    name=f"{car_name}_Door_Rear_{side_name}",
                    side=side,
                    y_pos=-car_length / 2 + 0.45,
                    car_width=car_width,
                    mat_frame=mat_metal_dark,
                    mat_panel=mat_white,
                    mat_glass=mat_dark_glass,
                    mat_handle=mat_cyan_halo
                )
                door_rear.parent = car_empty

        # =========================================================================
        # 4. 3D VECTOR TYPOGRAPHY & LIVERY MARKINGS (Standard Upright Text)
        # =========================================================================
        # In standard Blender space:
        # Side wall normal: (+1, 0, 0) for side 1, (-1, 0, 0) for side -1.
        # Text default: normal is +Z, upright is +Y.
        # To face +X with upright +Z:
        # Rotate around X by 90 deg (text normal -> +Y, upright -> +Z)
        # Rotate around Z by -90 deg for side 1 (text normal -> +X)
        for side in [-1, 1]:
            rot_z = -math.pi / 2 if side == 1 else math.pi / 2
            x_pos = side * (car_width / 2 + 0.012)
            rot = (math.pi / 2, 0, rot_z)

            if car_idx == 0:
                t_num = create_3d_text_mesh(
                    f"{car_name}_Txt_01_{side}", "01", size=0.22, extrude=0.008,
                    mat=mat_text_dark, rot=rot, loc=(x_pos, 1.05, 0.52)
                )
                t_num.parent = car_empty

                t_yh = create_3d_text_mesh(
                    f"{car_name}_Txt_YH_{side}", "YH EXPRESS", size=0.10, extrude=0.008,
                    mat=mat_text_dark, rot=rot, loc=(x_pos, -0.2, 0.35)
                )
                t_yh.parent = car_empty

                t_sub = create_3d_text_mesh(
                    f"{car_name}_Txt_Sub_{side}", "IDEAS IN MOTION", size=0.045, extrude=0.006,
                    mat=mat_text_blue, rot=rot, loc=(x_pos, -0.2, 0.28)
                )
                t_sub.parent = car_empty

            elif car_idx == 1:
                t_num = create_3d_text_mesh(
                    f"{car_name}_Txt_02_{side}", "02", size=0.20, extrude=0.008,
                    mat=mat_text_dark, rot=rot, loc=(x_pos, 0.4, 0.48)
                )
                t_num.parent = car_empty

                t_label = create_3d_text_mesh(
                    f"{car_name}_Txt_Learn_{side}", "LEARN", size=0.065, extrude=0.006,
                    mat=mat_text_blue, rot=rot, loc=(x_pos, 0.4, 0.32)
                )
                t_label.parent = car_empty

            elif car_idx == 2:
                t_num = create_3d_text_mesh(
                    f"{car_name}_Txt_03_{side}", "03", size=0.20, extrude=0.008,
                    mat=mat_text_dark, rot=rot, loc=(x_pos, 0.4, 0.48)
                )
                t_num.parent = car_empty

                t_label = create_3d_text_mesh(
                    f"{car_name}_Txt_Build_{side}", "BUILD", size=0.065, extrude=0.006,
                    mat=mat_text_blue, rot=rot, loc=(x_pos, 0.4, 0.32)
                )
                t_label.parent = car_empty

            elif car_idx == 3:
                t_num = create_3d_text_mesh(
                    f"{car_name}_Txt_04_{side}", "04", size=0.20, extrude=0.008,
                    mat=mat_text_dark, rot=rot, loc=(x_pos, 0.4, 0.48)
                )
                t_num.parent = car_empty

                t_label = create_3d_text_mesh(
                    f"{car_name}_Txt_Grow_{side}", "GROW", size=0.065, extrude=0.006,
                    mat=mat_text_blue, rot=rot, loc=(x_pos, 0.4, 0.32)
                )
                t_label.parent = car_empty

        # =========================================================================
        # 5. STREAMLINED ROOF HVAC AIR CONDITIONING UNITS
        # =========================================================================
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        hvac = bpy.context.active_object
        hvac.name = f"{car_name}_HVAC"
        hvac.parent = car_empty
        hvac.scale = (0.72, 1.4, 0.11)
        hvac.location = (0, -0.3, 0.88)
        hvac.data.materials.append(mat_metal_dark)
        bev_hvac = hvac.modifiers.new(name="Bevel", type='BEVEL')
        bev_hvac.width = 0.03
        bev_hvac.segments = 2

        for slat_x in [-0.22, 0, 0.22]:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            slat = bpy.context.active_object
            slat.name = f"{car_name}_HVAC_Slat_{slat_x}"
            slat.parent = hvac
            slat.scale = (0.12, 0.85, 0.02)
            slat.location = (slat_x, 0, 0.06)
            slat.data.materials.append(mat_metal_dark)

        # =========================================================================
        # 6. LEAD LOCOMOTIVE: ORGANIC AERODYNAMIC BULLET NOSE & COCKPIT
        # =========================================================================
        if is_lead:
            nose_mesh = bpy.data.meshes.new("Locomotive_AeroNoseMesh")
            bm_n = bmesh.new()

            # Multi-station lofting along +Y (forward aerodynamic bullet nose)
            nose_stations = [
                # (y_offset, width_factor, height_factor, z_center_shift)
                (car_length / 2, 1.0, 1.0, 0.0),
                (car_length / 2 + 0.35, 0.96, 0.92, -0.04),
                (car_length / 2 + 0.70, 0.86, 0.78, -0.10),
                (car_length / 2 + 1.10, 0.70, 0.60, -0.18),
                (car_length / 2 + 1.45, 0.48, 0.42, -0.28),
                (car_length / 2 + 1.68, 0.22, 0.18, -0.34),
                (car_length / 2 + 1.78, 0.06, 0.05, -0.36),
            ]

            nose_rings = []
            for y, wf, hf, zs in nose_stations:
                ring = []
                for px, pz in profile_pts:
                    x = px * wf
                    z = (pz + zs) * hf
                    v = bm_n.verts.new((x, y, z))
                    ring.append(v)
                nose_rings.append(ring)

            for i in range(len(nose_rings) - 1):
                r1 = nose_rings[i]
                r2 = nose_rings[i + 1]
                for p in range(len(profile_pts)):
                    p_next = (p + 1) % len(profile_pts)
                    bm_n.faces.new([r1[p], r2[p], r2[p_next], r1[p_next]])

            bm_n.faces.new([nose_rings[-1][len(profile_pts) - 1 - p] for p in range(len(profile_pts))])
            bm_n.to_mesh(nose_mesh)
            bm_n.free()

            nose_obj = bpy.data.objects.new("Locomotive_AeroNose", nose_mesh)
            scene.collection.objects.link(nose_obj)
            nose_obj.parent = car_empty
            nose_obj.data.materials.append(mat_white)

            subsurf = nose_obj.modifiers.new(name="Subdivision", type='SUBSURF')
            subsurf.levels = 2
            subsurf.render_levels = 2
            for f in nose_obj.data.polygons:
                f.use_smooth = True

            # Cockpit Wraparound Panoramic Windshield
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            ws = bpy.context.active_object
            ws.name = "Locomotive_Windshield"
            ws.parent = car_empty
            ws.scale = (0.78, 1.0, 0.52)
            ws.rotation_euler = (math.pi / 4.1, 0, 0)
            ws.location = (0, car_length / 2 + 0.48, 0.58)
            ws.data.materials.append(mat_dark_glass)

            # Dual Windshield Wipers
            for w_side in [-0.18, 0.18]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.007, depth=0.30, vertices=8)
                wiper = bpy.context.active_object
                wiper.name = f"Wiper_{w_side}"
                wiper.parent = car_empty
                wiper.rotation_euler = (math.pi / 4.1, -0.32, 0)
                wiper.location = (w_side, car_length / 2 + 0.50, 0.60)
                wiper.data.materials.append(mat_metal_dark)

            # Glowing Destination Board: "NEXT STOP: A BRIGHTER TOMORROW ->"
            bpy.ops.mesh.primitive_plane_add(size=1.0)
            dest_frame = bpy.context.active_object
            dest_frame.name = "Locomotive_DestFrame"
            dest_frame.parent = car_empty
            dest_frame.scale = (0.72, 1.0, 0.10)
            dest_frame.rotation_euler = (math.pi / 4.1, 0, 0)
            dest_frame.location = (0, car_length / 2 + 0.36, 0.74)
            dest_frame.data.materials.append(mat_metal_dark)

            dest_txt = create_3d_text_mesh(
                "Locomotive_DestText", "NEXT STOP: A BRIGHTER TOMORROW ->", size=0.038, extrude=0.004,
                mat=mat_cyan_halo, rot=(math.pi / 4.1, 0, 0), loc=(0, car_length / 2 + 0.365, 0.742)
            )
            dest_txt.parent = car_empty

            # Front Nose Badge: "YH EXPRESS" + "BUILD · LEARN · CREATE"
            t_badge1 = create_3d_text_mesh(
                "Locomotive_Badge_YH", "YH EXPRESS", size=0.075, extrude=0.006,
                mat=mat_text_dark, rot=(math.pi / 4.5, 0, 0), loc=(0, car_length / 2 + 1.40, 0.34)
            )
            t_badge1.parent = car_empty

            t_badge2 = create_3d_text_mesh(
                "Locomotive_Badge_Tag", "BUILD · LEARN · CREATE", size=0.032, extrude=0.004,
                mat=mat_text_blue, rot=(math.pi / 4.5, 0, 0), loc=(0, car_length / 2 + 1.45, 0.28)
            )
            t_badge2.parent = car_empty

            # Dual Projector Headlights & Angled Cyan Halo Lightbars
            for h_side in [-1, 1]:
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.075, segments=16, ring_count=16)
                hl = bpy.context.active_object
                hl.name = f"Headlight_{h_side}"
                hl.parent = car_empty
                hl.location = (h_side * 0.32, car_length / 2 + 1.12, 0.26)
                hl.data.materials.append(mat_cyan_halo)

                bpy.ops.mesh.primitive_plane_add(size=1.0)
                halo = bpy.context.active_object
                halo.name = f"HeadlightBlade_{h_side}"
                halo.parent = car_empty
                halo.scale = (0.032, 1.0, 0.20)
                halo.rotation_euler = (0.2, -h_side * 0.62, 0)
                halo.location = (h_side * 0.37, car_length / 2 + 1.15, 0.32)
                halo.data.materials.append(mat_cyan_halo)

            # Lower Aerodynamic Chin Spoiler
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            spoiler = bpy.context.active_object
            spoiler.name = "Locomotive_ChinSpoiler"
            spoiler.parent = car_empty
            spoiler.scale = (0.88, 0.42, 0.08)
            spoiler.location = (0, car_length / 2 + 1.35, 0.08)
            spoiler.data.materials.append(mat_blue)
            bev_sp = spoiler.modifiers.new(name="Bevel", type='BEVEL')
            bev_sp.width = 0.02

            # High-Speed Electric Scissor Pantograph
            panto_root = bpy.data.objects.new("Pantograph", None)
            scene.collection.objects.link(panto_root)
            panto_root.parent = car_empty
            panto_root.location = (0, -0.75, 0.88)

            for ix in [-0.22, 0.22]:
                for iy in [-0.18, 0.18]:
                    bpy.ops.mesh.primitive_cylinder_add(radius=0.028, depth=0.10, vertices=12)
                    ins = bpy.context.active_object
                    ins.name = f"Insulator_{ix}_{iy}"
                    ins.parent = panto_root
                    ins.location = (ix, iy, 0.05)
                    ins.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cube_add(size=1.0)
            pbase = bpy.context.active_object
            pbase.name = "Panto_BasePlate"
            pbase.parent = panto_root
            pbase.scale = (0.54, 0.46, 0.025)
            pbase.location = (0, 0, 0.10)
            pbase.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.52, vertices=10)
            arm1 = bpy.context.active_object
            arm1.name = "Panto_Arm1"
            arm1.parent = panto_root
            arm1.rotation_euler = (-0.65, 0, 0)
            arm1.location = (0, -0.16, 0.28)
            arm1.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.56, vertices=10)
            arm2 = bpy.context.active_object
            arm2.name = "Panto_Arm2"
            arm2.parent = panto_root
            arm2.rotation_euler = (0.75, 0, 0)
            arm2.location = (0, 0.04, 0.58)
            arm2.data.materials.append(mat_metal_dark)

            bpy.ops.mesh.primitive_cube_add(size=1.0)
            collector = bpy.context.active_object
            collector.name = "Panto_Collector"
            collector.parent = panto_root
            collector.scale = (0.80, 0.075, 0.025)
            collector.location = (0, 0.24, 0.76)
            collector.data.materials.append(mat_steel)

            for horn_side in [-0.42, 0.42]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.10, vertices=8)
                horn = bpy.context.active_object
                horn.name = f"Panto_Horn_{horn_side}"
                horn.parent = panto_root
                horn.rotation_euler = (0, -horn_side * 0.8, 0)
                horn.location = (horn_side, 0.24, 0.74)
                horn.data.materials.append(mat_steel)

        # =========================================================================
        # 7. REAR CARRIAGE: VERTICAL RED LED TAILLIGHTS & REAR MARKINGS
        # =========================================================================
        if is_rear:
            for side in [-1, 1]:
                bpy.ops.mesh.primitive_plane_add(size=1.0)
                tl = bpy.context.active_object
                tl.name = f"Taillight_{side}"
                tl.parent = car_empty
                tl.scale = (0.038, 1.0, 0.38)
                tl.rotation_euler = (math.pi / 2, 0, math.pi)
                tl.location = (side * 0.42, -car_length / 2 - 0.008, 0.38)
                tl.data.materials.append(mat_red_tail)

            bpy.ops.mesh.primitive_plane_add(size=1.0)
            rw = bpy.context.active_object
            rw.name = "Rear_Window"
            rw.parent = car_empty
            rw.scale = (0.64, 1.0, 0.28)
            rw.rotation_euler = (math.pi / 2, 0, math.pi)
            rw.location = (0, -car_length / 2 - 0.008, 0.52)
            rw.data.materials.append(mat_dark_glass)

            t_ryh = create_3d_text_mesh(
                "Rear_Txt_YH", "YH", size=0.08, extrude=0.004,
                mat=mat_cyan_halo, rot=(math.pi / 2, 0, math.pi), loc=(0, -car_length / 2 - 0.012, 0.58)
            )
            t_ryh.parent = car_empty

            t_rbuild = create_3d_text_mesh(
                "Rear_Txt_Build", "KEEP BUILDING ->", size=0.036, extrude=0.004,
                mat=mat_cyan_halo, rot=(math.pi / 2, 0, math.pi), loc=(0, -car_length / 2 - 0.012, 0.48)
            )
            t_rbuild.parent = car_empty

        # =========================================================================
        # 8. UNDERBODY BOGIE TRUCKS WITH FLANGED STEEL WHEELS & SUSPENSION
        # =========================================================================
        for bogie_y in [car_length * 0.32, -car_length * 0.32]:
            bogie = bpy.data.objects.new(f"{car_name}_Bogie_{bogie_y:.1f}", None)
            scene.collection.objects.link(bogie)
            bogie.parent = car_empty
            bogie.location = (0, bogie_y, 0.06)

            bpy.ops.mesh.primitive_cube_add(size=1.0)
            frame = bpy.context.active_object
            frame.name = "Bogie_Frame"
            frame.parent = bogie
            frame.scale = (0.86, 0.86, 0.08)
            frame.location = (0, 0, 0)
            frame.data.materials.append(mat_metal_dark)

            for air_x in [-0.36, 0.36]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.055, depth=0.12, vertices=12)
                air_spring = bpy.context.active_object
                air_spring.name = f"AirSpring_{air_x}"
                air_spring.parent = bogie
                air_spring.location = (air_x, 0, 0.08)
                air_spring.data.materials.append(mat_metal_dark)

            for axle_y in [0.28, -0.28]:
                bpy.ops.mesh.primitive_cylinder_add(radius=0.032, depth=0.96, vertices=12)
                axle = bpy.context.active_object
                axle.name = "Axle"
                axle.parent = bogie
                axle.rotation_euler = (0, math.pi / 2, 0)
                axle.location = (0, axle_y, -0.04)
                axle.data.materials.append(mat_steel)

                for bx in [-0.26, 0.26]:
                    bpy.ops.mesh.primitive_cube_add(size=1.0)
                    caliper = bpy.context.active_object
                    caliper.name = f"BrakeCaliper_{bx}_{axle_y}"
                    caliper.parent = bogie
                    caliper.scale = (0.04, 0.12, 0.08)
                    caliper.location = (bx, axle_y, -0.02)
                    caliper.data.materials.append(mat_metal_dark)

                for wx in [-0.52, 0.52]:
                    side_code = "R" if wx > 0 else "L"
                    bogie_code = "Front" if bogie_y > 0 else "Rear"
                    axle_code = "1" if axle_y > 0 else "2"
                    wheel_name = f"{car_name}_Wheel_{bogie_code}_{side_code}_{axle_code}"
                    wheel = create_flanged_wheel_mesh(wheel_name, mat_steel)
                    scene.collection.objects.link(wheel)
                    wheel.parent = bogie
                    wheel.location = (wx, axle_y, -0.04)

        # Aerodynamic Side Skirts with Bogie Cutouts
        for s_side in [-1, 1]:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            skirt = bpy.context.active_object
            skirt.name = f"{car_name}_Skirt_{s_side}"
            skirt.parent = car_empty
            skirt.scale = (0.02, car_length * 0.96, 0.09)
            skirt.location = (s_side * (car_width / 2 - 0.02), 0, 0.08)
            skirt.data.materials.append(mat_blue)

        # =========================================================================
        # 9. GANGWAY BELLOWS BETWEEN ADJACENT CARRIAGES
        # =========================================================================
        if not is_lead:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            gangway = bpy.context.active_object
            gangway.name = f"{car_name}_Gangway"
            gangway.parent = car_empty
            gangway.scale = (0.84, car_spacing - 0.02, 0.68)
            gangway.location = (0, car_length / 2 + car_spacing / 2, 0.42)
            gangway.data.materials.append(mat_metal_dark)

        return car_empty

    # Build the 4-car high-speed train EMU
    build_carriage(0, is_lead=True, is_rear=False)
    build_carriage(1, is_lead=False, is_rear=False)
    build_carriage(2, is_lead=False, is_rear=False)
    build_carriage(3, is_lead=False, is_rear=True)

    # =========================================================================
    # 10. REALISTIC RAILWAY TRACK SYSTEM UNDER THE TRAIN (Matching Reference)
    # =========================================================================
    print("-> Assembling Railway Track, Sleepers & Ballast Bed...")
    track_root = bpy.data.objects.new("Track_System", None)
    scene.collection.objects.link(track_root)

    track_len = 22.0
    track_y_start = -16.0
    track_y_end = 6.0

    # 10A. Ballast Roadbed Base (Dark Gravel)
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    ballast = bpy.context.active_object
    ballast.name = "Track_Ballast_Bed"
    ballast.parent = track_root
    ballast.scale = (2.4, track_len, 0.16)
    ballast.location = (0, (track_y_start + track_y_end) / 2, -0.16)
    ballast.data.materials.append(mat_ballast)
    bev_b = ballast.modifiers.new(name="Bevel", type='BEVEL')
    bev_b.width = 0.08

    # 10B. Ground Floor Slab (Matching Blueprint Presentation Floor)
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    floor = bpy.context.active_object
    floor.name = "Studio_Floor"
    floor.scale = (50.0, 50.0, 1.0)
    floor.location = (0, 0, -0.24)
    floor.data.materials.append(mat_ballast)

    # 10C. Concrete / Wooden Sleepers (Ties)
    num_sleepers = int(track_len / 0.55)
    for s_idx in range(num_sleepers):
        sy = track_y_start + s_idx * 0.55
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        sleeper = bpy.context.active_object
        sleeper.name = f"Sleeper_{s_idx}"
        sleeper.parent = track_root
        sleeper.scale = (1.85, 0.18, 0.07)
        sleeper.location = (0, sy, -0.05)
        sleeper.data.materials.append(mat_sleeper)

    # 10D. Dual Steel Rails (Seated right under the wheels at x = -0.52 and +0.52)
    for rx in [-0.52, 0.52]:
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        rail = bpy.context.active_object
        rail.name = f"Steel_Rail_{rx}"
        rail.parent = track_root
        rail.scale = (0.055, track_len, 0.08)
        rail.location = (rx, (track_y_start + track_y_end) / 2, 0.015)
        rail.data.materials.append(mat_steel)

    # =========================================================================
    # 11. PROFESSIONAL 3-POINT STUDIO LIGHTING RIG
    # =========================================================================
    print("-> Setting up 3-Point Studio Lighting...")
    lights_root = bpy.data.objects.new("Studio_Lights", None)
    scene.collection.objects.link(lights_root)

    # Key Light (Front-Right warm illumination)
    key_light_data = bpy.data.lights.new(name="Key_Light", type='AREA')
    key_light_data.energy = 1500.0
    key_light_data.color = (1.0, 0.96, 0.90)
    key_light_data.size = 5.0
    key_light = bpy.data.objects.new("Key_Light", key_light_data)
    scene.collection.objects.link(key_light)
    key_light.parent = lights_root
    key_light.location = (5.5, 5.0, 3.5)

    # Fill Light (Left-Side cool sky fill)
    fill_light_data = bpy.data.lights.new(name="Fill_Light", type='AREA')
    fill_light_data.energy = 800.0
    fill_light_data.color = (0.85, 0.92, 1.0)
    fill_light_data.size = 6.0
    fill_light = bpy.data.objects.new("Fill_Light", fill_light_data)
    scene.collection.objects.link(fill_light)
    fill_light.parent = lights_root
    fill_light.location = (-6.0, 4.0, 2.5)

    # Rim / Back Light (High specular rim along roof cantrail and pantograph)
    rim_light_data = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_light_data.energy = 1800.0
    rim_light_data.color = (0.95, 0.98, 1.0)
    rim_light_data.size = 5.0
    rim_light = bpy.data.objects.new("Rim_Light", rim_light_data)
    scene.collection.objects.link(rim_light)
    rim_light.parent = lights_root
    rim_light.location = (0.0, -8.0, 4.5)

    # Directional Sun for overall daylight balance
    sun_data = bpy.data.lights.new(name="Sun_Light", type='SUN')
    sun_data.energy = 4.5
    sun_data.color = (1.0, 0.98, 0.95)
    sun = bpy.data.objects.new("Sun_Light", sun_data)
    scene.collection.objects.link(sun)
    sun.parent = lights_root
    sun.rotation_euler = (0.6, 0.4, 0.2)

    # =========================================================================
    # 12. HERO PRESENTATION CAMERA (Matching media_1789893916682.jpg)
    # =========================================================================
    print("-> Setting up Hero Presentation Camera...")
    cam_data = bpy.data.cameras.new(name="Hero_Camera")
    cam_data.lens = 45.0
    cam_obj = bpy.data.objects.new("Hero_Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = (5.5, 6.8, 2.2)

    # Camera Target Empty pointing right at the lead locomotive's front nose
    cam_target = bpy.data.objects.new("Camera_Target", None)
    scene.collection.objects.link(cam_target)
    cam_target.location = (0, 1.2, 0.45)

    # Track constraint
    con = cam_obj.constraints.new(type='TRACK_TO')
    con.target = cam_target
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Z'  # Standard Blender Z-up!

    scene.camera = cam_obj

    # Configure Render Engine & Resolution
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.film_transparent = False

    # Set 3D Viewports to Material Preview Mode
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.shading.type = 'MATERIAL'

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "models"))
    os.makedirs(output_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # EXPORT 1: Master Blender 4.2 Project File (.blend)
    # -------------------------------------------------------------------------
    blend_path = os.path.join(output_dir, "yh_express.blend")
    print(f"[1/5] Saving Blender Master Project to {blend_path}...")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("      -> Saved .blend successfully!")

    # -------------------------------------------------------------------------
    # EXPORT 2: Production WebGL / Three.js Asset (.glb)
    # Selection-only: Train hierarchy ONLY (no environment, floor, tracks, lights)
    # -------------------------------------------------------------------------
    glb_path = os.path.join(output_dir, "yh-express.glb")
    glb_legacy_path = os.path.join(output_dir, "yh_express.glb")
    print(f"[2/5] Exporting Web-Ready GLB to {glb_path}...")

    # Deselect all and select ONLY the train hierarchy
    bpy.ops.object.select_all(action='DESELECT')
    def select_hierarchy(obj):
        obj.select_set(True)
        for child in obj.children:
            select_hierarchy(child)
    select_hierarchy(train_root)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_materials='EXPORT',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
    )
    print("      -> Exported Draco-compressed yh-express.glb successfully!")

    import shutil
    shutil.copyfile(glb_path, glb_legacy_path)
    print(f"      -> Copied to {glb_legacy_path} for backward compatibility!")

    # -------------------------------------------------------------------------
    # EXPORT 3: Autodesk FBX Asset (.fbx)
    # -------------------------------------------------------------------------
    fbx_path = os.path.join(output_dir, "yh_express.fbx")
    print(f"[3/5] Exporting FBX to {fbx_path}...")
    bpy.ops.export_scene.fbx(
        filepath=fbx_path,
        use_selection=False,
        apply_scale_options='FBX_SCALE_ALL',
    )
    print("      -> Exported .fbx successfully!")

    # -------------------------------------------------------------------------
    # EXPORT 4: Wavefront OBJ Asset (.obj)
    # -------------------------------------------------------------------------
    obj_path = os.path.join(output_dir, "yh_express.obj")
    print(f"[4/4] Exporting OBJ to {obj_path}...")
    if hasattr(bpy.ops.wm, 'obj_export'):
        bpy.ops.wm.obj_export(filepath=obj_path)
    else:
        bpy.ops.export_scene.obj(filepath=obj_path)
    print("      -> Exported .obj successfully!")

    # -------------------------------------------------------------------------
    # EXPORT 5: High-Resolution Verification Still Render (.png)
    # -------------------------------------------------------------------------
    render_img_path = os.path.join(output_dir, "yh_express_render.png")
    print(f"[5/5] Rendering High-Res Verification Image to {render_img_path}...")
    scene.render.filepath = render_img_path
    try:
        bpy.ops.render.render(write_still=True)
        print(f"      -> Rendered {render_img_path} successfully!")
    except Exception as e:
        print(f"      -> Note: Render skipped or {e}")

    print("=" * 70)
    print("COMPLETE: Standard-Space Master Blender Project & All 4 Assets Built!")
    print("=" * 70)

if __name__ == "__main__":
    build_advanced_yh_express()
