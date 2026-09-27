import bpy

# Test draco support in bpy.ops.export_scene.gltf
import inspect

print("Testing glTF export options...")
doc = bpy.ops.export_scene.gltf.get_rna_type()
properties = [p.identifier for p in doc.properties]
has_draco = 'export_draco_mesh_compression_enable' in properties
print("Has Draco option:", has_draco)
