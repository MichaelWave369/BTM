"""Optional Linux/Mesa developer check: exact shipped GLSL + vertex data on GLES.
This does not automate a browser or emulate a physical WebXR device.
"""
import ctypes as C
import hashlib
import json
import re
from pathlib import Path

source = Path('src/vr-world-renderer.js').read_text()
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
surface_attrs = (integer * 5)(0x3057, 640, 0x3056, 360, 0x3038)
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
import base64, io, sys
from PIL import Image, ImageDraw
fixture_path=Path(sys.argv[1]);fixture=json.loads(fixture_path.read_text());assert len(fixture['sectors'])==12

def program_for(vertex,fragment):
    shaders=[]
    for kind,content in [(0x8B31,vertex),(0x8B30,fragment)]:
        s=create_shader(kind);text=C.c_char_p(content.encode());shader_source(s,1,C.byref(text),None);compile_shader(s);status=integer();get_shader(s,0x8B81,C.byref(status))
        if not status.value:
            log=C.create_string_buffer(4096);get_shader_log(s,4096,None,log);raise RuntimeError(log.value.decode())
        shaders.append(s)
    p=gl('glCreateProgram',C.c_uint)()
    for s in shaders:gl('glAttachShader',None,C.c_uint,C.c_uint)(p,s)
    gl('glLinkProgram',None,C.c_uint)(p);status=integer();gl('glGetProgramiv',None,C.c_uint,C.c_uint,C.POINTER(integer))(p,0x8B82,C.byref(status));assert status.value
    for s in shaders:gl('glDeleteShader',None,C.c_uint)(s)
    return p
shader=lambda key:re.search(r"\b"+key+r"='([^']+)'",source).group(1)
program=program_for(shader('WORLD_VERTEX_SHADER'),shader('WORLD_FRAGMENT_SHADER'));overlay=program_for(shader('OVERLAY_VERTEX'),shader('OVERLAY_FRAGMENT'));gl('glUseProgram',None,C.c_uint)(program)
uniform=lambda name:gl('glGetUniformLocation',integer,C.c_uint,C.c_char_p)(program,name.encode())
vertex_buffer,texture=C.c_uint(),C.c_uint();gl('glGenBuffers',None,integer,C.POINTER(C.c_uint))(1,C.byref(vertex_buffer));gl('glBindBuffer',None,C.c_uint,C.c_uint)(0x8892,vertex_buffer.value)
for name,size,offset in [('p',3,0),('uv',2,12),('tint',4,20)]:
    loc=gl('glGetAttribLocation',integer,C.c_uint,C.c_char_p)(program,name.encode());gl('glEnableVertexAttribArray',None,C.c_uint)(loc);gl('glVertexAttribPointer',None,C.c_uint,integer,C.c_uint,C.c_ubyte,integer,void)(loc,size,0x1406,0,36,void(offset))
gl('glGenTextures',None,integer,C.POINTER(C.c_uint))(1,C.byref(texture));gl('glBindTexture',None,C.c_uint,C.c_uint)(0x0DE1,texture.value)
for key,value in [(0x2801,0x2600),(0x2800,0x2600),(0x2802,0x812F),(0x2803,0x812F)]:gl('glTexParameteri',None,C.c_uint,C.c_uint,integer)(0x0DE1,key,value)
gl('glUniform1i',None,integer,integer)(uniform('image'),0);gl('glUniform3f',None,integer,C.c_float,C.c_float,C.c_float)(uniform('fog'),.012,.022,.016);gl('glUniform1f',None,integer,C.c_float)(uniform('farDistance'),27);gl('glEnable',None,C.c_uint)(0x0B71);gl('glDepthFunc',None,C.c_uint)(0x0203);gl('glDisable',None,C.c_uint)(0x0B44)
output=Path('docs/v0.4.0/render-evidence');output.mkdir(exist_ok=True);contact=Image.new('RGB',(1280,1180),'#07130f');draw=ImageDraw.Draw(contact);results=[]
for sector in fixture['sectors']:
    packed=base64.b64decode(sector['vertices']);values=C.create_string_buffer(packed);gl('glBufferData',None,C.c_uint,C.c_ssize_t,void,C.c_uint)(0x8892,len(packed),values,0x88E4)
    image=Image.open(io.BytesIO(base64.b64decode(sector['atlas'].split(',')[1]))).convert('RGBA');pixels=C.create_string_buffer(image.tobytes());gl('glTexImage2D',None,C.c_uint,integer,integer,integer,integer,integer,C.c_uint,C.c_uint,void)(0x0DE1,0,0x1908,image.width,image.height,0,0x1908,0x1401,pixels)
    gl('glUniform3f',None,integer,C.c_float,C.c_float,C.c_float)(uniform('eye'),*sector['eye']);gl('glClearColor',None,C.c_float,C.c_float,C.c_float,C.c_float)(0,0,0,1);gl('glClear',None,C.c_uint)(0x4000|0x0100)
    for index,vp in enumerate(sector['views']):
        matrix=(C.c_float*16)(*vp);gl('glUniformMatrix4fv',None,integer,integer,C.c_ubyte,C.POINTER(C.c_float))(uniform('vp'),1,0,matrix);gl('glViewport',None,integer,integer,integer,integer)(index*320,0,320,360);gl('glDrawArrays',None,C.c_uint,integer,integer)(4,0,sector['vertexCount'])
    gl('glFinish',None)();rgba=(C.c_ubyte*(640*360*4))();gl('glReadPixels',None,integer,integer,integer,integer,C.c_uint,C.c_uint,void)(0,0,640,360,0x1908,0x1401,rgba);assert gl('glGetError',C.c_uint)()==0
    rendered=Image.frombytes('RGBA',(640,360),bytes(rgba)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB');left,right=rendered.crop((0,0,320,360)),rendered.crop((320,0,640,360));colors=len(left.getcolors(320*360)or[]);assert colors>30;assert left.tobytes()!=right.tobytes()
    filename='sector-'+str(sector['sector']).zfill(2)+'-stereo.png';rendered.save(output/filename);col=(sector['sector']-1)%4;row=(sector['sector']-1)//4;contact.paste(rendered.resize((320,360)),(col*320,row*390+24));draw.text((col*320+8,row*390+5),'SECTOR '+str(sector['sector'])+' / SOFTWARE GLES',(185,255,83));results.append(dict(sector=sector['sector'],passed=True,vertices=sector['vertexCount'],colors=colors,stereoDisparity=True,image=filename,sha256=hashlib.sha256(rendered.tobytes()).hexdigest()))
contact.save(output/'twelve-sector-stereo.png');report=dict(passed=True,sectors=12,renderer=renderer,version=version,worldAndComfortShadersCompiled=True,results=results,sourceSha256=hashlib.sha256(source.encode()).hexdigest(),fixtureSha256=hashlib.sha256(fixture_path.read_bytes()).hexdigest(),method='Exact shipped world/comfort GLSL compiled on surfaceless Mesa EGL/GLES. Actual twelve-map geometry, dynamic batch, Canvas atlas and synthetic per-eye matrices exported from browser QA. Stereo pixels differ in each eye. Not browser WebGL API execution, physical Quest, real XR, haptics, comfort or frame rate validation.');Path('docs/v0.4.0/gles-world-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
bind('eglMakeCurrent',integer,void,void,void,void)(display,None,None,None);bind('eglDestroyContext',integer,void,void)(display,context);bind('eglDestroySurface',integer,void,void)(display,surface);bind('eglTerminate',integer,void)(display)
