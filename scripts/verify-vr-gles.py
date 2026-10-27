"""Optional Linux/Mesa developer check: exact shipped GLSL + vertex data on GLES.
This does not automate a browser or emulate a physical WebXR device.
"""
import ctypes as C
import hashlib
import json
import re
from pathlib import Path

source = Path('src/vr-renderer.js').read_text()
egl = C.CDLL('libEGL.so.1')
def bind(name, restype, *args):
    fn = getattr(egl, name); fn.restype = restype; fn.argtypes = list(args); return fn
void = C.c_void_p
integer = C.c_int
get_display = bind('eglGetPlatformDisplay', void, C.c_uint, void, C.POINTER(integer))
display = get_display(0x31DD, None, None)  # EGL_PLATFORM_SURFACELESS_MESA
initialize = bind('eglInitialize', integer, void, C.POINTER(integer), C.POINTER(integer))
major, minor = integer(), integer()
assert initialize(display, C.byref(major), C.byref(minor)), 'Surfaceless EGL unavailable'
assert bind('eglBindAPI', integer, C.c_uint)(0x30A0)  # OpenGL ES
attributes = (integer * 15)(0x3033, 1, 0x3040, 4, 0x3024, 8, 0x3023, 8, 0x3022, 8, 0x3021, 8, 0x3025, 24, 0x3038)
config, count = void(), integer()
assert bind('eglChooseConfig', integer, void, C.POINTER(integer), C.POINTER(void), integer, C.POINTER(integer))(display, attributes, C.byref(config), 1, C.byref(count)) and count.value
surface_attrs = (integer * 5)(0x3057, 128, 0x3056, 64, 0x3038)
surface = bind('eglCreatePbufferSurface', void, void, void, C.POINTER(integer))(display, config, surface_attrs)
context_attrs = (integer * 3)(0x3098, 2, 0x3038)
context = bind('eglCreateContext', void, void, void, void, C.POINTER(integer))(display, config, None, context_attrs)
assert surface and context and bind('eglMakeCurrent', integer, void, void, void, void)(display, surface, surface, context)
get_proc = bind('eglGetProcAddress', void, C.c_char_p)
def gl(name, restype, *args):
    address = get_proc(name.encode()); assert address, name
    return C.CFUNCTYPE(restype, *args)(address)
get_string = gl('glGetString', C.c_char_p, C.c_uint)
renderer = get_string(0x1F01).decode(); version = get_string(0x1F02).decode()
create_shader = gl('glCreateShader', C.c_uint, C.c_uint)
shader_source = gl('glShaderSource', None, C.c_uint, integer, C.POINTER(C.c_char_p), C.POINTER(integer))
compile_shader = gl('glCompileShader', None, C.c_uint)
get_shader = gl('glGetShaderiv', None, C.c_uint, C.c_uint, C.POINTER(integer))
get_shader_log = gl('glGetShaderInfoLog', None, C.c_uint, integer, C.POINTER(integer), void)
shaders = []
for kind, label in [(0x8B31, 'VERTEX_SHADER'), (0x8B30, 'FRAGMENT_SHADER')]:
    text = re.search(r"shader\(gl\." + label + r",'([^']+)'\)", source).group(1).encode()
    shader = create_shader(kind); string = C.c_char_p(text); shader_source(shader, 1, C.byref(string), None); compile_shader(shader)
    status = integer(); get_shader(shader, 0x8B81, C.byref(status))
    if not status.value:
        log = C.create_string_buffer(4096); get_shader_log(shader, 4096, None, log); raise RuntimeError(log.value.decode())
    shaders.append(shader)
program = gl('glCreateProgram', C.c_uint)()
for shader in shaders: gl('glAttachShader', None, C.c_uint, C.c_uint)(program, shader)
gl('glLinkProgram', None, C.c_uint)(program)
linked = integer(); gl('glGetProgramiv', None, C.c_uint, C.c_uint, C.POINTER(integer))(program, 0x8B82, C.byref(linked)); assert linked.value, 'Program did not link'
gl('glUseProgram', None, C.c_uint)(program)
vertices = [float(v) for v in re.search(r'gl.bufferData\(gl.ARRAY_BUFFER,new Float32Array\(\[([^]]+)\]', source).group(1).split(',')]
buffer = C.c_uint(); gl('glGenBuffers', None, integer, C.POINTER(C.c_uint))(1, C.byref(buffer)); gl('glBindBuffer', None, C.c_uint, C.c_uint)(0x8892, buffer.value)
values = (C.c_float * len(vertices))(*vertices); gl('glBufferData', None, C.c_uint, C.c_ssize_t, void, C.c_uint)(0x8892, C.sizeof(values), values, 0x88E4)
for name, size, offset in [('p', 3, 0), ('uv', 2, 12)]:
    loc = gl('glGetAttribLocation', integer, C.c_uint, C.c_char_p)(program, name.encode())
    gl('glEnableVertexAttribArray', None, C.c_uint)(loc); gl('glVertexAttribPointer', None, C.c_uint, integer, C.c_uint, C.c_ubyte, integer, void)(loc, size, 0x1406, 0, 20, void(offset))
texture = C.c_uint(); gl('glGenTextures', None, integer, C.POINTER(C.c_uint))(1, C.byref(texture)); gl('glBindTexture', None, C.c_uint, C.c_uint)(0x0DE1, texture.value)
for key, value in [(0x2801, 0x2600), (0x2800, 0x2600), (0x2802, 0x812F), (0x2803, 0x812F)]: gl('glTexParameteri', None, C.c_uint, C.c_uint, integer)(0x0DE1, key, value)
# Canvas-like bytes: top row red, bottom row green. Top UV must display red.
pixels = (C.c_ubyte * 64)(*([240, 20, 10, 255] * 8 + [10, 220, 30, 255] * 8))
gl('glTexImage2D', None, C.c_uint, integer, integer, integer, integer, integer, C.c_uint, C.c_uint, void)(0x0DE1, 0, 0x1908, 4, 4, 0, 0x1908, 0x1401, pixels)
uniform = lambda name: gl('glGetUniformLocation', integer, C.c_uint, C.c_char_p)(program, name.encode())
identity = (C.c_float * 16)(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)
gl('glUniformMatrix4fv', None, integer, integer, C.c_ubyte, C.POINTER(C.c_float))(uniform('m'), 1, 0, identity)
gl('glUniform1i', None, integer, integer)(uniform('image'), 0)
gl('glUniform1f', None, integer, C.c_float)(uniform('textured'), 1)
gl('glUniform4f', None, integer, C.c_float, C.c_float, C.c_float, C.c_float)(uniform('color'), 1, 1, 1, 1)
gl('glClearColor', None, C.c_float, C.c_float, C.c_float, C.c_float)(0, 0, 0, 1); gl('glClear', None, C.c_uint)(0x4000)
for x in [0, 64]:
    gl('glViewport', None, integer, integer, integer, integer)(x, 0, 64, 64); gl('glDrawArrays', None, C.c_uint, integer, integer)(4, 0, 6)
gl('glFinish', None)()
read = gl('glReadPixels', None, integer, integer, integer, integer, C.c_uint, C.c_uint, void)
samples = {}
for name, x, y, channel in [('leftTop', 32, 40, 0), ('leftBottom', 32, 24, 1), ('rightTop', 96, 40, 0), ('rightBottom', 96, 24, 1)]:
    pixel = (C.c_ubyte * 4)(); read(x, y, 1, 1, 0x1908, 0x1401, pixel); samples[name] = list(pixel); assert pixel[channel] > 200, (name, list(pixel))
assert gl('glGetError', C.c_uint)() == 0, 'GLES error'
report = dict(passed=True, renderer=renderer, version=version, exactSourceShaderCompilation=True, exactSourceVertexBuffer=True, textureOrientation=True, twoViewports=True, samples=samples, sourceSha256=hashlib.sha256(source.encode()).hexdigest(), method='Surfaceless Mesa EGL/GLES software rendering of the exact shipped shader strings and vertex buffer. Not a browser WebGL or headset/session/hardware validation.')
Path('docs/v0.4.0/gles-arcade-check.json').write_text(json.dumps(report, indent=2)+'\n'); print(json.dumps(report, indent=2))
bind('eglMakeCurrent', integer, void, void, void, void)(display, None, None, None)
bind('eglDestroyContext', integer, void, void)(display, context); bind('eglDestroySurface', integer, void, void)(display, surface); bind('eglTerminate', integer, void)(display)
