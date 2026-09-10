"""Logo LW+ doré en 3D : génère public/image/lwplus/*.webp (#3303).

Usage : blender -b --python scripts/generate-lwplus-logo.py -- <variant> <dossier> [still|anim] [hauteur] [contour]
Puis :  img2webp -loop 1 -d 33 -lossy -q 80 -m 4 <dossier>/frames_<variant>/f_*.png -o <variant>.webp
        cwebp -q 82 -alpha_q 100 -m 6 <dossier>/frames_<variant>/f_0001.png -o <variant>_still.webp

Le `_still` est l'image affichée au repos : le WebP animé jouerait son tour tout
seul au premier affichage. Sa dernière image est identique à la première, donc
l'échange au survol ne saute pas.

Assets livrés : `anim 400 6` pour les deux variantes.
variant : lwplus | plus
Lettres L et W reprises telles quelles des tracés de leekwars_flat.svg
(unités SVG, y vers le bas). Le « + » reprend la grammaire du logo :
trait de 4.254, hauteur d'x 17.017, diagonale sur le haut du premier trait.
"""
import sys, os, math
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
variant = argv[0]
out_dir = argv[1]
mode = argv[2] if len(argv) > 2 else 'still'
size = int(argv[3]) if len(argv) > 3 else 512
# Contour noir Freestyle, désactivé par défaut (jugé « pas ouf » le 10/09) :
# passer une épaisseur en 5e argument pour le rallumer.
OUTLINE = float(argv[4]) if len(argv) > 4 else 0.0
os.makedirs(out_dir, exist_ok=True)

S = 4.254          # épaisseur de trait du logo
XH = 17.017        # hauteur d'x
CAP = 23.778       # hauteur de capitale
GAP = 2.6

L = [(0, CAP), (0, 4.148), (S, 0), (S, 19.523), (16.956, 19.523), (16.956, CAP)]
W = [(0, CAP), (0, 10.991), (S, 6.761), (S, 19.523), (2 * S, 19.523), (2 * S, 6.761),
     (3 * S, 6.761), (3 * S, 19.523), (4 * S, 19.523), (4 * S, 6.761), (5 * S, 6.761), (5 * S, CAP)]
W = [(x + 0, y) for x, y in W]  # largeur 21.27


def plus(size_, chamfer=True):
    """Croix de côté size_, bras d'épaisseur S, coin haut-gauche du bras du haut biseauté."""
    a = (size_ - S) / 2  # longueur d'un bras
    top = CAP - size_
    head = [(a, top + S), (a + S, top)] if chamfer else [(a, top), (a + S, top)]
    return head + [
        (a + S, CAP - a - S), (size_, CAP - a - S), (size_, CAP - a), (a + S, CAP - a),
        (a + S, CAP), (a, CAP), (a, CAP - a), (0, CAP - a), (0, CAP - a - S), (a, CAP - a - S),
    ]


def shifted(poly, dx):
    return [(x + dx, y) for x, y in poly]


if variant == 'lwplus':
    polys = [L, shifted(W, 16.956 + GAP), shifted(plus(XH), 16.956 + GAP + 21.27 + GAP)]
else:
    polys = [plus(XH)]

# Boîte englobante → centrage
xs = [x for p in polys for x, _ in p]
ys = [y for p in polys for _, y in p]
cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
width, height = max(xs) - min(xs), max(ys) - min(ys)
SC = 0.1

# Scène propre
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def make_curve(name, polys_local):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '2D'
    curve.fill_mode = 'BOTH'
    curve.extrude = 0.14
    curve.bevel_depth = 0.035
    curve.bevel_resolution = 4
    curve.resolution_u = 1
    for poly in polys_local:
        sp = curve.splines.new('POLY')
        sp.points.add(len(poly) - 1)
        for pt, (x, y) in zip(sp.points, poly):
            pt.co = (x * SC, -y * SC, 0, 1)
        sp.use_cyclic_u = True
        sp.use_smooth = True
    o = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(o)
    # La courbe 2D vit dans XY ; on la dresse dans le plan XZ, face à -Y
    o.rotation_euler = (math.radians(90), 0, 0)
    return o

def centered(poly, ox, oy):
    return [(x - ox, y - oy) for x, y in poly]

# Seule la croix tourne : elle est fille d'un pivot placé à son centre
plus_poly = polys[-1]
pcx = (min(x for x, _ in plus_poly) + max(x for x, _ in plus_poly)) / 2
pcy = (min(y for _, y in plus_poly) + max(y for _, y in plus_poly)) / 2
center = bpy.data.objects.new('Center', None)
scene.collection.objects.link(center)
pivot = bpy.data.objects.new('Pivot', None)
scene.collection.objects.link(pivot)
pivot.location = ((pcx - cx) * SC, 0, -(pcy - cy) * SC)
plus_obj = make_curve('Plus', [centered(plus_poly, pcx, pcy)])
plus_obj.parent = pivot
objs = [plus_obj]
if len(polys) > 1:
    objs.append(make_curve('Letters', [centered(p, cx, cy) for p in polys[:-1]]))

# Matériau or PBR
mat = bpy.data.materials.new('Gold')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
# Dégradé vertical dans le métal : orange en haut, or en bas. Le haut du signe
# se perdait sur le parchemin clair (retour de Pierre, 10/09). En coordonnées
# OBJET, donc stable pendant la rotation. L'axe vertical du glyphe est Y local
# (la courbe est tracée dans XY puis dressée de 90° sur X).
nt_m = mat.node_tree
tex = nt_m.nodes.new('ShaderNodeTexCoord')
sep_m = nt_m.nodes.new('ShaderNodeSeparateXYZ')
nt_m.links.new(tex.outputs['Object'], sep_m.inputs['Vector'])
map_m = nt_m.nodes.new('ShaderNodeMath')
map_m.operation = 'MULTIPLY_ADD'
map_m.inputs[1].default_value = 0.62
map_m.inputs[2].default_value = 0.5
nt_m.links.new(sep_m.outputs['Y'], map_m.inputs[0])
ramp_m = nt_m.nodes.new('ShaderNodeValToRGB')
cm = ramp_m.color_ramp
cm.elements[0].position = 0.0
cm.elements[0].color = (1.0, 0.82, 0.34, 1)
e = cm.elements.new(0.55); e.color = (1.0, 0.70, 0.22, 1)
cm.elements[-1].position = 1.0
cm.elements[-1].color = (1.0, 0.44, 0.08, 1)
nt_m.links.new(map_m.outputs['Value'], ramp_m.inputs['Fac'])
nt_m.links.new(ramp_m.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Metallic'].default_value = 1.0
bsdf.inputs['Roughness'].default_value = 0.2
bsdf.inputs['Coat Weight'].default_value = 0.3
for o in objs:
    o.data.materials.append(mat)

# Monde : HDRI studio de Blender, invisible à la caméra
world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes['Background']
bg.inputs['Strength'].default_value = 1.15
# Environnement « bijouterie » : ciel clair et froid en haut, bande chaude et
# brillante à l'horizon, sol ambre sombre. C'est ce que l'or reflète.
texco = nt.nodes.new('ShaderNodeTexCoord')
sep = nt.nodes.new('ShaderNodeSeparateXYZ')
nt.links.new(texco.outputs['Generated'], sep.inputs['Vector'])
ramp = nt.nodes.new('ShaderNodeValToRGB')
cr = ramp.color_ramp
cr.elements[0].position = 0.0
cr.elements[0].color = (0.22, 0.05, 0.00, 1)
e = cr.elements.new(0.40); e.color = (0.85, 0.30, 0.04, 1)
e = cr.elements.new(0.48); e.color = (1.30, 0.95, 0.45, 1)
e = cr.elements.new(0.56); e.color = (1.00, 0.52, 0.10, 1)
e = cr.elements.new(0.78); e.color = (0.85, 0.34, 0.05, 1)
cr.elements[-1].position = 1.0
cr.elements[-1].color = (0.55, 0.20, 0.03, 1)
norm = nt.nodes.new('ShaderNodeMath')
norm.operation = 'MULTIPLY_ADD'
norm.inputs[1].default_value = 0.5
norm.inputs[2].default_value = 0.5
nt.links.new(sep.outputs['Z'], norm.inputs[0])
nt.links.new(norm.outputs['Value'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])

# Lumières : une clé chaude en haut à gauche, un contre froid derrière à droite
def light(name, kind, loc, energy, color=(1, 1, 1), size_=2.0):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == 'AREA':
        ld.size = size_
    lo = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    tgt = lo.constraints.new('TRACK_TO')
    tgt.target = center
    tgt.track_axis = 'TRACK_NEGATIVE_Z'
    tgt.up_axis = 'UP_Y'
    return lo

light('Key', 'AREA', (-4, -6, 6), 850, (1.0, 0.84, 0.52), 3.0)
light('Rim', 'AREA', (5, 5, 3), 900, (1.0, 0.65, 0.35), 2.0)
light('Fill', 'AREA', (5, -6, -1), 380, (1.0, 0.45, 0.12), 4.0)

# Caméra face au logo, légèrement au-dessus
cam_data = bpy.data.cameras.new('Camera')
cam_data.lens = 85
cam = bpy.data.objects.new('Camera', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
ratio = 2.0 if variant == 'lwplus' else 1.0
frame_w = max(width, height * ratio) * SC * 1.38
dist = frame_w / 2 / math.tan(cam_data.angle_x / 2)
cam.location = (0, -dist, dist * 0.10)
tr = cam.constraints.new('TRACK_TO')
tr.target = center
tr.track_axis = 'TRACK_NEGATIVE_Z'
tr.up_axis = 'UP_Y'

# Rendu
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = int(size * ratio)
scene.render.resolution_y = size
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.eevee.taa_render_samples = 64

if OUTLINE > 0:
    # Contour noir Freestyle : le signe doit se détacher sur les fonds clairs comme
    # sombres. Épaisseur ABSOLUE (en pixels de rendu) pour ne pas dépendre de la
    # résolution. Silhouette + bords + plis vifs seulement : sans un angle de pli
    # élevé, le biseau des arêtes se ferait souligner tout du long.
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = 'ABSOLUTE'
    scene.render.line_thickness = 1.0
    view_layer = scene.view_layers[0]
    view_layer.use_freestyle = True
    fs = view_layer.freestyle_settings
    fs.crease_angle = math.radians(80)
    # Un jeu de lignes VIDE (linestyle à None) préexiste sur la couche de vue et
    # ferait planter le rendu (parameter_editor : 'NoneType' has no use_chaining).
    # On repart de zéro, et le style créé avec le jeu de lignes reçoit un faux
    # utilisateur, sinon il est purgé à l'enregistrement du .blend.
    while fs.linesets:
        fs.linesets.remove(fs.linesets[0])
    lineset = fs.linesets.new('Outline')
    lineset.select_silhouette = True
    lineset.select_border = True
    lineset.select_crease = True
    lineset.select_edge_mark = False
    lineset.select_material_boundary = False
    linestyle = lineset.linestyle
    linestyle.use_fake_user = True
    linestyle.color = (0, 0, 0)
    linestyle.thickness = OUTLINE
    linestyle.thickness_position = 'INSIDE'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'

# Animation : un tour complet autour de l'axe vertical
FRAMES = 30
scene.frame_start = 1
scene.frame_end = FRAMES + 1
scene.render.fps = 30
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
pivot.rotation_euler = (0, 0, 0)
pivot.keyframe_insert('rotation_euler', frame=1)
pivot.rotation_euler = (0, 0, math.radians(360))
pivot.keyframe_insert('rotation_euler', frame=FRAMES + 1)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, f'{variant}.blend'))

if mode == 'still':
    for f in (1, 12, 30):
        scene.frame_set(f)
        scene.render.filepath = os.path.join(out_dir, f'{variant}_still_{f:03d}.png')
        bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = os.path.join(out_dir, f'frames_{variant}', 'f_')
    bpy.ops.render.render(animation=True)
print('DONE', variant, width, height)
