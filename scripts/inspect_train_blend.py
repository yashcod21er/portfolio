import bpy
import sys

blend_path = r"c:\Users\Yash Hogade\OneDrive\Documents\portfolio\public\models\yh_express.blend"
bpy.ops.wm.open_mainfile(filepath=blend_path)

print("\n=== BLENDER SCENE INSPECTION ===")
print("Scene name:", bpy.context.scene.name)
print("Total objects:", len(bpy.data.objects))
print("Total meshes:", len(bpy.data.meshes))
print("Total materials:", len(bpy.data.materials))
print("Total collections:", len(bpy.data.collections))

for col in bpy.data.collections:
    print(f"\nCollection: {col.name}")
    for obj in col.objects:
        print(f"  - {obj.name} (type: {obj.type}, parent: {obj.parent.name if obj.parent else None})")

print("\n--- Objects and Hierarchy ---")
for obj in bpy.data.objects:
    poly_count = len(obj.data.polygons) if obj.type == 'MESH' and obj.data else 0
    print(f"Object: {obj.name:30} | Type: {obj.type:8} | Polys: {poly_count:6} | Parent: {obj.parent.name if obj.parent else 'None'}")

print("\n--- Materials ---")
for mat in bpy.data.materials:
    print(f"Material: {mat.name} (use_nodes: {mat.use_nodes})")

print("=== END INSPECTION ===\n")
