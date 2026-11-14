#!/usr/bin/env python3
"""
generate_speaker_glb.py
=======================
Complete executable 3D geometry reconstruction script using `trimesh`, `numpy`,
and `Pillow` that constructs the exact physical DIY Speaker from the 5 reference
photographs (FRONT, BACK, LEFT, RIGHT, TOP) using standard 3D primitives,
boolean/annular extrusions, and PBR materials, and exports `speaker.glb`.

Usage:
    pip install trimesh numpy pillow scipy
    python3 generate_speaker_glb.py
"""

import math
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual import TextureVisuals
from PIL import Image, ImageDraw


def create_crosshatch_enclosure_texture(size: int = 512) -> Image.Image:
    """Generates the heavily textured, slightly worn cross-hatched black vinyl texture."""
    rng = np.random.default_rng(4099)
    img = Image.new("RGBA", (size, size), (20, 21, 23, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # Fine grain noise
    for _ in range(4500):
        x = int(rng.integers(0, size))
        y = int(rng.integers(0, size))
        v = int(rng.integers(14, 36))
        draw.rectangle([x, y, x + 2, y + 2], fill=(v, v, v + 1, 255))

    # Criss-cross fibrous scratch lines across the enclosure exterior
    for _ in range(1800):
        x1 = float(rng.uniform(0, size))
        y1 = float(rng.uniform(0, size))
        angle = float(rng.uniform(-math.pi / 2, math.pi / 2))
        length = float(rng.uniform(18, 95))
        x2 = x1 + math.cos(angle) * length
        y2 = y1 + math.sin(angle) * length
        if rng.random() > 0.84:
            # Subtle worn greyish-tan scratch
            a = int(rng.integers(35, 85))
            draw.line([(x1, y1), (x2, y2)], fill=(148, 142, 128, a), width=1)
        else:
            s = int(rng.integers(8, 28))
            draw.line([(x1, y1), (x2, y2)], fill=(s, s, s + 2, 160), width=1)

    return img


def create_module_gold_streak_texture(w: int = 512, h: int = 256) -> Image.Image:
    """Generates the glossy black electronics module texture with diagonal gold/copper streaks."""
    rng = np.random.default_rng(8821)
    img = Image.new("RGBA", (w, h), (18, 19, 22, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # White/silver paint speckles
    for _ in range(380):
        sx = int(rng.integers(0, w))
        sy = int(rng.integers(0, h))
        sr = int(rng.integers(1, 4))
        a = int(rng.integers(70, 190))
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(215, 220, 228, a))

    # Diagonal branching gold/copper streaks across the back module
    branches = [
        ((18, h - 22), (w - 26, 20), 14),
        ((135, h - 75), (118, 28), 9),
        ((245, h - 115), (290, 22), 10),
        ((220, h - 102), (365, h - 82), 8),
        ((340, 82), (435, 110), 7),
    ]
    for p1, p2, width in branches:
        draw.line([p1, p2], fill=(154, 98, 36, 255), width=width + 4)
        draw.line([p1, p2], fill=(209, 150, 69, 255), width=width)

    return img


def make_pbr_mesh(
    mesh: trimesh.Trimesh,
    name: str,
    base_color=(0.1, 0.1, 0.11, 1.0),
    metallic: float = 0.08,
    roughness: float = 0.7,
    emissive=(0.0, 0.0, 0.0),
    texture_img: Image.Image = None,
) -> trimesh.Trimesh:
    """Attaches a glTF 2.0 PBRMaterial to a trimesh primitive."""
    mesh.metadata["name"] = name
    if texture_img is not None:
        verts = mesh.vertices
        mins = verts.min(axis=0)
        span = np.maximum(verts.max(axis=0) - mins, 1e-5)
        uv = np.column_stack(
            [(verts[:, 0] - mins[0]) / span[0], (verts[:, 1] - mins[1]) / span[1]]
        )
        mat = PBRMaterial(
            name=f"Mat_{name}",
            baseColorTexture=texture_img,
            metallicFactor=metallic,
            roughnessFactor=roughness,
            emissiveFactor=emissive,
        )
        mesh.visual = TextureVisuals(uv=uv, material=mat)
    else:
        mat = PBRMaterial(
            name=f"Mat_{name}",
            baseColorFactor=[int(c * 255) for c in base_color],
            metallicFactor=metallic,
            roughnessFactor=roughness,
            emissiveFactor=emissive,
        )
        mesh.visual = TextureVisuals(material=mat)
    return mesh


def create_conical_frustum_shell(
    r_outer: float,
    r_inner: float,
    depth: float,
    thickness: float = 0.012,
    sections: int = 64,
) -> trimesh.Trimesh:
    """Creates a 3D conical speaker diaphragm shell using revolved profile triangles."""
    angles = np.linspace(0, 2 * math.pi, sections, endpoint=False)
    verts = []
    faces = []

    for theta in angles:
        c, s = math.cos(theta), math.sin(theta)
        verts.append([r_outer * c, r_outer * s, 0.0])
        verts.append([r_inner * c, r_inner * s, -depth])
        verts.append([r_inner * c, r_inner * s, -depth - thickness])
        verts.append([r_outer * c, r_outer * s, -thickness])

    for i in range(sections):
        ni = (i + 1) % sections
        b0 = i * 4
        b1 = ni * 4
        faces.append([b0 + 0, b1 + 0, b1 + 1])
        faces.append([b0 + 0, b1 + 1, b0 + 1])
        faces.append([b0 + 2, b1 + 2, b1 + 3])
        faces.append([b0 + 2, b1 + 3, b0 + 3])
        faces.append([b0 + 3, b1 + 3, b1 + 0])
        faces.append([b0 + 3, b1 + 0, b0 + 0])
        faces.append([b0 + 1, b1 + 1, b1 + 2])
        faces.append([b0 + 1, b1 + 2, b0 + 2])

    return trimesh.Trimesh(vertices=np.array(verts), faces=np.array(faces), process=True)


def create_tube_along_curve(
    control_points: list, radius: float = 0.013, tubular_segments: int = 28, radial_segments: int = 12
) -> trimesh.Trimesh:
    """Sweeps a circular cross-section along a smooth 3D spline for insulated wires."""
    pts = np.array(control_points, dtype=float)
    t_vals = np.linspace(0, 1, len(pts))
    t_fine = np.linspace(0, 1, tubular_segments)
    path = np.column_stack([np.interp(t_fine, t_vals, pts[:, j]) for j in range(3)])

    verts = []
    faces = []
    angles = np.linspace(0, 2 * math.pi, radial_segments, endpoint=False)

    for i in range(tubular_segments):
        if i < tubular_segments - 1:
            tangent = path[i + 1] - path[i]
        else:
            tangent = path[i] - path[i - 1]
        tangent = tangent / (np.linalg.norm(tangent) + 1e-8)
        up = np.array([0.0, 1.0, 0.0]) if abs(tangent[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
        normal = np.cross(tangent, up)
        normal /= np.linalg.norm(normal) + 1e-8
        binormal = np.cross(tangent, normal)

        for a in angles:
            offset = normal * (math.cos(a) * radius) + binormal * (math.sin(a) * radius)
            verts.append(path[i] + offset)

    for i in range(tubular_segments - 1):
        for j in range(radial_segments):
            nj = (j + 1) % radial_segments
            v00 = i * radial_segments + j
            v01 = i * radial_segments + nj
            v10 = (i + 1) * radial_segments + j
            v11 = (i + 1) * radial_segments + nj
            faces.append([v00, v01, v11])
            faces.append([v00, v11, v10])

    return trimesh.Trimesh(vertices=np.array(verts), faces=np.array(faces), process=True)


def build_speaker_scene() -> trimesh.Scene:
    """Constructs the complete multi-mesh 3D DIY Speaker scene matching all 5 views."""
    scene = trimesh.Scene()

    enclosure_tex = create_crosshatch_enclosure_texture(512)
    module_tex = create_module_gold_streak_texture(512, 256)

    W, H, D = 1.40, 2.60, 1.40
    HW, HH, HD = W / 2.0, H / 2.0, D / 2.0

    # 1. ENCLOSURE CABINET BODY
    core_box = trimesh.creation.box(extents=[W - 0.04, H - 0.04, D - 0.04])
    make_pbr_mesh(
        core_box,
        "Enclosure_Main_Cabinet",
        base_color=(0.09, 0.095, 0.105, 1.0),
        metallic=0.08,
        roughness=0.72,
        texture_img=enclosure_tex,
    )
    scene.add_geometry(core_box, node_name="Enclosure_Main_Cabinet")

    # 2. FRONT VIEW (+Z): UPPER SPEAKER DRIVER (y = +0.62)
    upper_y = 0.62
    upper_recess = trimesh.creation.annulus(r_min=0.335, r_max=0.36, height=0.06, sections=64)
    upper_recess.apply_translation([0, upper_y, HD - 0.01])
    make_pbr_mesh(
        upper_recess,
        "Front_Upper_Driver_Recess_Rim",
        base_color=(0.16, 0.13, 0.10, 1.0),
        metallic=0.04,
        roughness=0.86,
    )
    scene.add_geometry(upper_recess, node_name="Front_Upper_Driver_Recess_Rim")

    upper_surround = trimesh.creation.torus(major_radius=0.315, minor_radius=0.026, major_sections=64, minor_sections=24)
    upper_surround.apply_scale([1.0, 1.0, 0.65])
    upper_surround.apply_translation([0, upper_y, HD - 0.005])
    make_pbr_mesh(
        upper_surround,
        "Front_Upper_Driver_Surround",
        base_color=(0.11, 0.12, 0.14, 1.0),
        metallic=0.08,
        roughness=0.42,
    )
    scene.add_geometry(upper_surround, node_name="Front_Upper_Driver_Surround")

    upper_cone = create_conical_frustum_shell(r_outer=0.298, r_inner=0.095, depth=0.10, sections=64)
    upper_cone.apply_translation([0, upper_y, HD - 0.01])
    make_pbr_mesh(
        upper_cone,
        "Front_Upper_Driver_Cone",
        base_color=(0.14, 0.15, 0.17, 1.0),
        metallic=0.06,
        roughness=0.78,
    )
    scene.add_geometry(upper_cone, node_name="Front_Upper_Driver_Cone")

    upper_cap = trimesh.creation.icosphere(subdivisions=3, radius=0.115)
    upper_cap.apply_scale([1.0, 1.0, 0.48])
    upper_cap.apply_translation([0, upper_y, HD - 0.085])
    make_pbr_mesh(
        upper_cap,
        "Front_Upper_Driver_Glossy_DustCap",
        base_color=(0.04, 0.04, 0.05, 1.0),
        metallic=0.20,
        roughness=0.08,
    )
    scene.add_geometry(upper_cap, node_name="Front_Upper_Driver_Glossy_DustCap")

    for side, sx in [("Left", -0.044), ("Right", 0.044)]:
        lead_drop = trimesh.creation.capsule(height=0.052, radius=0.014, count=[12, 16])
        rot = trimesh.transformations.euler_matrix(0.38, -0.12 * np.sign(sx), 0.52 * np.sign(sx))
        lead_drop.apply_transform(rot)
        lead_drop.apply_translation([sx, upper_y - 0.125, HD - 0.045])
        make_pbr_mesh(
            lead_drop,
            f"Front_Upper_Driver_LeadGlue_{side}",
            base_color=(0.04, 0.04, 0.05, 1.0),
            metallic=0.18,
            roughness=0.10,
        )
        scene.add_geometry(lead_drop, node_name=f"Front_Upper_Driver_LeadGlue_{side}")

    # 3. FRONT VIEW (+Z): CENTRAL TRANSLUCENT WHITE LED DIFFUSER RING (y = -0.08)
    led_ring = trimesh.creation.annulus(r_min=0.212, r_max=0.325, height=0.016, sections=64)
    led_ring.apply_translation([0, -0.08, HD - 0.004])
    make_pbr_mesh(
        led_ring,
        "Front_Center_LED_Diffuser_Ring",
        base_color=(0.85, 0.87, 0.90, 1.0),
        metallic=0.02,
        roughness=0.32,
        emissive=(0.14, 0.15, 0.17),
    )
    scene.add_geometry(led_ring, node_name="Front_Center_LED_Diffuser_Ring")

    # 4. FRONT VIEW (+Z): LOWER SMALLER SPEAKER DRIVER (y = -0.76)
    lower_y = -0.76
    lower_recess = trimesh.creation.annulus(r_min=0.205, r_max=0.228, height=0.075, sections=64)
    lower_recess.apply_translation([0, lower_y, HD - 0.018])
    make_pbr_mesh(
        lower_recess,
        "Front_Lower_Driver_Recess_Wall",
        base_color=(0.18, 0.15, 0.11, 1.0),
        metallic=0.04,
        roughness=0.85,
    )
    scene.add_geometry(lower_recess, node_name="Front_Lower_Driver_Recess_Wall")

    lower_surround = trimesh.creation.torus(major_radius=0.184, minor_radius=0.022, major_sections=48, minor_sections=20)
    lower_surround.apply_scale([1.0, 1.0, 0.65])
    lower_surround.apply_translation([0, lower_y, HD - 0.032])
    make_pbr_mesh(
        lower_surround,
        "Front_Lower_Driver_Surround",
        base_color=(0.11, 0.12, 0.14, 1.0),
        metallic=0.08,
        roughness=0.42,
    )
    scene.add_geometry(lower_surround, node_name="Front_Lower_Driver_Surround")

    lower_cone = create_conical_frustum_shell(r_outer=0.172, r_inner=0.058, depth=0.072, sections=48)
    lower_cone.apply_translation([0, lower_y, HD - 0.035])
    make_pbr_mesh(
        lower_cone,
        "Front_Lower_Driver_Cone",
        base_color=(0.14, 0.15, 0.17, 1.0),
        metallic=0.06,
        roughness=0.78,
    )
    scene.add_geometry(lower_cone, node_name="Front_Lower_Driver_Cone")

    lower_cap = trimesh.creation.cylinder(radius=0.062, height=0.018, sections=36)
    lower_cap.apply_translation([0, lower_y, HD - 0.095])
    make_pbr_mesh(
        lower_cap,
        "Front_Lower_Driver_DustCap",
        base_color=(0.10, 0.11, 0.13, 1.0),
        metallic=0.10,
        roughness=0.38,
    )
    scene.add_geometry(lower_cap, node_name="Front_Lower_Driver_DustCap")

    # 5. BACK VIEW (-Z): RAISED ELECTRONICS MODULE, RECESSED PANEL, PORTS & WIRING
    raised_mod = trimesh.creation.box(extents=[0.69, 0.445, 0.23])
    raised_mod.apply_translation([0.365, 1.08, -0.805])
    make_pbr_mesh(
        raised_mod,
        "Back_Raised_Electronics_Module",
        base_color=(0.12, 0.12, 0.14, 1.0),
        metallic=0.25,
        roughness=0.28,
        texture_img=module_tex,
    )
    scene.add_geometry(raised_mod, node_name="Back_Raised_Electronics_Module")

    mod_patch = trimesh.creation.box(extents=[0.21, 0.12, 0.014])
    mod_patch.apply_translation([0.54, 1.20, -0.922])
    make_pbr_mesh(
        mod_patch,
        "Back_Module_Window_Patch",
        base_color=(0.16, 0.18, 0.21, 1.0),
        metallic=0.15,
        roughness=0.45,
    )
    scene.add_geometry(mod_patch, node_name="Back_Module_Window_Patch")

    top_switch = trimesh.creation.box(extents=[0.032, 0.055, 0.028])
    top_switch.apply_translation([0.16, 1.332, -0.81])
    make_pbr_mesh(
        top_switch,
        "Back_Module_Top_Switch",
        base_color=(0.05, 0.05, 0.06, 1.0),
        metallic=0.2,
        roughness=0.2,
    )
    scene.add_geometry(top_switch, node_name="Back_Module_Top_Switch")

    recess_plate = trimesh.creation.box(extents=[0.70, 0.44, 0.02])
    recess_plate.apply_translation([0.0, 0.62, -HD + 0.015])
    make_pbr_mesh(
        recess_plate,
        "Back_Recessed_Control_Plate",
        base_color=(0.09, 0.07, 0.06, 1.0),
        metallic=0.12,
        roughness=0.24,
    )
    scene.add_geometry(recess_plate, node_name="Back_Recessed_Control_Plate")

    toggle_cyl = trimesh.creation.cylinder(radius=0.026, height=0.045, sections=24)
    toggle_cyl.apply_translation([0.25, 0.73, -HD - 0.01])
    make_pbr_mesh(
        toggle_cyl,
        "Back_Toggle_Switch",
        base_color=(0.82, 0.84, 0.88, 1.0),
        metallic=0.90,
        roughness=0.22,
    )
    scene.add_geometry(toggle_cyl, node_name="Back_Toggle_Switch")

    for label, bx in [("Left", -0.01), ("Right", -0.21)]:
        btn = trimesh.creation.cylinder(radius=0.053, height=0.046, sections=32)
        btn.apply_translation([bx, 0.73, -HD - 0.012])
        make_pbr_mesh(
            btn,
            f"Back_Red_Button_{label}",
            base_color=(0.90, 0.13, 0.10, 1.0),
            metallic=0.05,
            roughness=0.28,
        )
        scene.add_geometry(btn, node_name=f"Back_Red_Button_{label}")

    for label, sx, sr in [("Left", 0.15, 0.052), ("Right", -0.20, 0.036)]:
        rim = trimesh.creation.annulus(r_min=sr * 0.82, r_max=sr, height=0.018, sections=32)
        rim.apply_translation([sx, 0.57, -HD - 0.004])
        make_pbr_mesh(
            rim,
            f"Back_Sensor_Rim_{label}",
            base_color=(0.72, 0.46, 0.22, 1.0),
            metallic=0.78,
            roughness=0.35,
        )
        scene.add_geometry(rim, node_name=f"Back_Sensor_Rim_{label}")

    barrel_port = trimesh.creation.annulus(r_min=0.024, r_max=0.038, height=0.024, sections=28)
    barrel_port.apply_translation([0.22, 0.45, -HD - 0.006])
    make_pbr_mesh(
        barrel_port,
        "Back_Barrel_Charging_Port",
        base_color=(0.72, 0.46, 0.22, 1.0),
        metallic=0.78,
        roughness=0.35,
    )
    scene.add_geometry(barrel_port, node_name="Back_Barrel_Charging_Port")

    usbc_port = trimesh.creation.box(extents=[0.088, 0.044, 0.022])
    usbc_port.apply_translation([0.08, 0.445, -HD - 0.006])
    make_pbr_mesh(
        usbc_port,
        "Back_USBC_Charging_Port",
        base_color=(0.72, 0.46, 0.22, 1.0),
        metallic=0.78,
        roughness=0.35,
    )
    scene.add_geometry(usbc_port, node_name="Back_USBC_Charging_Port")

    microsd_slot = trimesh.creation.box(extents=[0.16, 0.032, 0.018])
    microsd_slot.apply_translation([-0.18, 0.43, -HD - 0.004])
    make_pbr_mesh(
        microsd_slot,
        "Back_MicroSD_Slot",
        base_color=(0.78, 0.80, 0.84, 1.0),
        metallic=0.85,
        roughness=0.28,
    )
    scene.add_geometry(microsd_slot, node_name="Back_MicroSD_Slot")

    wire_specs = [
        (
            "Back_Wire_Red",
            (0.77, 0.16, 0.11, 1.0),
            [[0.03, 1.11, -0.77], [-0.02, 1.07, -0.80], [-0.09, 0.94, -0.82], [-0.11, 0.80, -0.80], [-0.06, 0.69, -0.76]],
            0.014,
        ),
        (
            "Back_Wire_Black",
            (0.16, 0.12, 0.11, 1.0),
            [[0.03, 1.09, -0.75], [-0.01, 1.04, -0.78], [-0.07, 0.92, -0.79], [-0.09, 0.79, -0.78], [-0.05, 0.68, -0.75]],
            0.013,
        ),
        (
            "Back_Wire_Green",
            (0.12, 0.61, 0.29, 1.0),
            [[0.04, 1.12, -0.75], [0.0, 1.13, -0.79], [-0.03, 1.09, -0.77], [0.01, 1.06, -0.73]],
            0.011,
        ),
        (
            "Back_Wire_Yellow",
            (0.86, 0.66, 0.16, 1.0),
            [[0.04, 1.10, -0.73], [-0.01, 1.11, -0.76], [-0.03, 1.07, -0.74], [0.01, 1.04, -0.72]],
            0.010,
        ),
    ]
    for w_name, w_color, w_pts, w_rad in wire_specs:
        w_mesh = create_tube_along_curve(w_pts, radius=w_rad)
        make_pbr_mesh(w_mesh, w_name, base_color=w_color, metallic=0.05, roughness=0.35)
        scene.add_geometry(w_mesh, node_name=w_name)

    blue_capsule = trimesh.creation.capsule(height=0.165, radius=0.044, count=[16, 24])
    rot_cap = trimesh.transformations.euler_matrix(math.pi / 2 + 0.18, -0.12, 0.56)
    blue_capsule.apply_transform(rot_cap)
    blue_capsule.apply_translation([0.01, 0.585, -0.755])
    make_pbr_mesh(
        blue_capsule,
        "Back_Blue_Connector_Capsule",
        base_color=(0.17, 0.56, 0.88, 1.0),
        metallic=0.06,
        roughness=0.32,
    )
    scene.add_geometry(blue_capsule, node_name="Back_Blue_Connector_Capsule")

    # 6. LEFT VIEW (+X) & RIGHT VIEW (-X): CIRCULAR BASS-REFLEX PORTS
    for side_name, sx, py in [("Left", HW, -0.62), ("Right", -HW, -0.70)]:
        sign = 1.0 if sx > 0 else -1.0
        port_ring = trimesh.creation.torus(major_radius=0.178, minor_radius=0.024, major_sections=48, minor_sections=20)
        port_ring.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
        port_ring.apply_translation([sx - sign * 0.008, py, 0.0])
        make_pbr_mesh(
            port_ring,
            f"{side_name}_Bass_Reflex_Port_Ring",
            base_color=(0.11, 0.12, 0.14, 1.0),
            metallic=0.08,
            roughness=0.42,
        )
        scene.add_geometry(port_ring, node_name=f"{side_name}_Bass_Reflex_Port_Ring")

        diaphragm = trimesh.creation.cylinder(radius=0.16, height=0.02, sections=48)
        diaphragm.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
        diaphragm.apply_translation([sx - sign * 0.012, py, 0.0])
        make_pbr_mesh(
            diaphragm,
            f"{side_name}_Bass_Reflex_Port_Diaphragm",
            base_color=(0.13, 0.14, 0.16, 1.0),
            metallic=0.06,
            roughness=0.75,
        )
        scene.add_geometry(diaphragm, node_name=f"{side_name}_Bass_Reflex_Port_Diaphragm")

    # 7. TOP VIEW (+Y): RECESSED RECTANGULAR ACCESS PANEL & SILVER 'R' MARKING
    top_groove = trimesh.creation.box(extents=[0.74, 0.016, 0.50])
    top_groove.apply_translation([0.01, HH - 0.004, 0.07])
    make_pbr_mesh(
        top_groove,
        "Top_Recessed_Panel_Groove",
        base_color=(0.06, 0.06, 0.07, 1.0),
        metallic=0.04,
        roughness=0.90,
    )
    scene.add_geometry(top_groove, node_name="Top_Recessed_Panel_Groove")

    top_lid = trimesh.creation.box(extents=[0.70, 0.018, 0.46])
    top_lid.apply_translation([0.01, HH - 0.002, 0.07])
    make_pbr_mesh(
        top_lid,
        "Top_Recessed_Panel_Lid",
        base_color=(0.10, 0.105, 0.115, 1.0),
        metallic=0.08,
        roughness=0.72,
        texture_img=enclosure_tex,
    )
    scene.add_geometry(top_lid, node_name="Top_Recessed_Panel_Lid")

    r_bars = [
        ("Stem", [-0.095, 0.0], [0.065, 0.38], 0.0),
        ("TopBar", [-0.01, -0.16], [0.21, 0.06], 0.0),
        ("MidBar", [-0.01, 0.0], [0.21, 0.06], 0.0),
        ("RightLoop", [0.085, -0.08], [0.06, 0.18], 0.0),
        ("DiagLeg", [0.045, 0.095], [0.065, 0.21], -0.46),
    ]
    for b_name, (ox, oz), (bw, bd), rot_y in r_bars:
        bar = trimesh.creation.box(extents=[bw, 0.008, bd])
        if rot_y != 0.0:
            bar.apply_transform(trimesh.transformations.rotation_matrix(rot_y, [0, 1, 0]))
        bar.apply_translation([0.46 + ox, HH + 0.002, -0.44 + oz])
        make_pbr_mesh(
            bar,
            f"Top_Silver_R_{b_name}",
            base_color=(0.84, 0.86, 0.89, 1.0),
            metallic=0.84,
            roughness=0.25,
        )
        scene.add_geometry(bar, node_name=f"Top_Silver_R_{b_name}")

    return scene


if __name__ == "__main__":
    speaker_scene = build_speaker_scene()
    glb_bytes = speaker_scene.export(file_type="glb")
    output_path = "speaker.glb"
    with open(output_path, "wb") as f:
        f.write(glb_bytes)
    print(f"Successfully exported {output_path} ({len(glb_bytes):,} bytes)")
