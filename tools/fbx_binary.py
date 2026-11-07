"""Lossless FBX binary node I/O; array property payloads are preserved as encoded."""
import struct,json,pathlib,shutil,datetime,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Node:
 def __init__(self,name,props=None,kids=None,term=False):self.name=name;self.props=props or [];self.kids=kids or [];self.term=term

def prop(data,p):
 start=p;t=chr(data[p]);p+=1
 if t in 'YCIFDL':p+={'Y':2,'C':1,'I':4,'F':4,'D':8,'L':8}[t]
 elif t in 'SR':n=struct.unpack_from('<I',data,p)[0];p+=4+n
 elif t in 'fdlibc':n,e,size=struct.unpack_from('<III',data,p);p+=12+size
 else:raise ValueError(t)
 return data[start:p],p

def value(p):
 t=chr(p[0]);return p[5:].decode('utf8') if t=='S' else struct.unpack('<q',p[1:])[0] if t=='L' else struct.unpack('<d',p[1:])[0] if t=='D' else None

def P(v):
 if isinstance(v,str):b=v.encode();return b'S'+struct.pack('<I',len(b))+b
 if isinstance(v,int):return b'L'+struct.pack('<q',v)
 return b'D'+struct.pack('<d',v)

def load(data):
 ver=struct.unpack_from('<I',data,23)[0];wide=ver>=7500;fmt='<QQQB' if wide else '<IIIB';h=25 if wide else 13
 def read(p):
  end,count,size,n=struct.unpack_from(fmt,data,p)
  if end==0:return None,p+h
  name=data[p+h:p+h+n].decode();pos=p+h+n;ps=[]
  for _ in range(count):v,pos=prop(data,pos);ps.append(v)
  kids=[];term=False
  while pos<end:
   child,pos=read(pos)
   if child is None:term=True;break
   kids.append(child)
  assert pos==end
  return Node(name,ps,kids,term),end
 nodes=[];p=27
 while True:
  n,p=read(p)
  if n is None:break
  nodes.append(n)
 return nodes,data[:27],data[p:],fmt,h

def save(nodes,header,tail,fmt,h):
 def enc(n,start):
  name=n.name.encode();props=b''.join(n.props);pos=start+h+len(name)+len(props);children=b''
  for c in n.kids:b=enc(c,pos);children+=b;pos+=len(b)
  if n.term:children+=b'\0'*h;pos+=h
  return struct.pack(fmt,pos,len(n.props),len(props),len(name))+name+props+children
 out=header
 for n in nodes:out+=enc(n,len(out))
 return out+b'\0'*h+tail

def geometry_hash(nodes):
 objs=next(n for n in nodes if n.name=='Objects')
 def sig(n):return n.name.encode()+b''.join(n.props)+b''.join(sig(k) for k in n.kids)
 return hashlib.sha256(b''.join(sig(n) for n in objs.kids if n.name in ('Geometry','Model'))).hexdigest()
