// Nine original Relay landscapes, signal lifts, fallen satellite arrays and final control chambers.

// All doors and optional upper decks are validated by the episode registry at boot.

const W=37,H=30;

const P=[
  [
    "relay-graveyard",
    "Relay Graveyard",
    "THE FALLEN ANTENNAS",
    "industrial",
    "#e5ba90",
    "#85dbc8",
    "The first relay field is buried under scrap. Restore two buried uplinks and find the gold service authority.",
    [
      [
        2,
        19,
        13,
        24
      ],
      [
        18,
        19,
        32,
        24
      ],
      [
        3,
        3,
        12,
        10
      ],
      [
        22,
        3,
        32,
        11
      ],
      [
        14,
        5,
        20,
        22
      ],
      [
        6,
        9,
        9,
        20
      ],
      [
        25,
        10,
        29,
        20
      ],
      [
        8,
        13,
        27,
        16
      ],
      [
        12,
        5,
        24,
        8
      ]
    ],
    [
      "SOUTH SCRAP YARD",
      "WEST RELAY BAY",
      "THE BURIED ARRAY",
      "AUTHORIZED SERVICE"
    ],
    [
      5,
      22
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        27,
        7
      ]
    ]
  ],
  [
    "glass-frontier",
    "Glass Frontier",
    "THE TRANSPARENT PRISON",
    "corporate",
    "#8fdbed",
    "#fcb78b",
    "The surveillance halls watch themselves. Silence the two glass-eye relays and cross the exposed central plaza.",
    [
      [
        2,
        3,
        10,
        25
      ],
      [
        25,
        3,
        32,
        25
      ],
      [
        11,
        2,
        24,
        7
      ],
      [
        11,
        21,
        24,
        25
      ],
      [
        8,
        11,
        27,
        15
      ],
      [
        13,
        7,
        20,
        23
      ],
      [
        5,
        17,
        29,
        19
      ]
    ],
    [
      "THE WATCH",
      "GLASS BARRACKS",
      "EXPOSED PLAZA",
      "SOUTHERN BRIDGE"
    ],
    [
      4,
      23
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        27,
        20
      ]
    ]
  ],
  [
    "signal-lift",
    "Signal Lift",
    "HANGING TRANSMISSION SHAFT",
    "cyberpunk",
    "#93ebff",
    "#efa0fa",
    "The tower lifts used to carry messages upward. The upper deck is optional; the relays live on the floor.",
    [
      [
        2,
        3,
        12,
        11
      ],
      [
        22,
        3,
        32,
        11
      ],
      [
        2,
        18,
        12,
        25
      ],
      [
        22,
        18,
        32,
        25
      ],
      [
        10,
        6,
        25,
        22
      ],
      [
        5,
        12,
        30,
        16
      ],
      [
        16,
        3,
        19,
        24
      ]
    ],
    [
      "GROUND LIFT",
      "TOWER FEED A",
      "TOWER FEED B",
      "UPPER GALLERY"
    ],
    [
      5,
      23
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        28,
        19
      ]
    ],
    "deck"
  ],
  [
    "cipher-vault",
    "Cipher Vault",
    "ARCHIVE OF LOST KEYS",
    "horror",
    "#db9fe1",
    "#91e4f0",
    "Three vault machines hide the master route. The blue badge unlocks a repair annex, not the final exit.",
    [
      [
        2,
        2,
        9,
        10
      ],
      [
        13,
        2,
        21,
        10
      ],
      [
        25,
        2,
        32,
        10
      ],
      [
        2,
        16,
        10,
        25
      ],
      [
        13,
        16,
        21,
        25
      ],
      [
        25,
        16,
        32,
        25
      ],
      [
        8,
        9,
        27,
        13
      ],
      [
        8,
        14,
        27,
        18
      ],
      [
        15,
        5,
        18,
        22
      ]
    ],
    [
      "CIPHER ROOM ONE",
      "QUANTIZED RECORDS",
      "MASTER KEY VAULT",
      "REPAIR ANNEX"
    ],
    [
      5,
      22
    ],
    [
      28,
      6
    ],
    [
      [
        5,
        6
      ],
      [
        17,
        10
      ],
      [
        28,
        20
      ]
    ],
    "blue"
  ],
  [
    "iron-horizon",
    "Iron Horizon",
    "THE ENDLESS COOLING WORKS",
    "industrial",
    "#ffcb94",
    "#83b8dc",
    "Service canals divide the cooling works. Cross the three hard bridges to restore the remaining field.",
    [
      [
        2,
        3,
        7,
        25
      ],
      [
        13,
        2,
        19,
        25
      ],
      [
        26,
        3,
        32,
        25
      ],
      [
        6,
        5,
        28,
        8
      ],
      [
        6,
        12,
        28,
        15
      ],
      [
        6,
        20,
        28,
        23
      ],
      [
        8,
        9,
        13,
        12
      ],
      [
        19,
        16,
        26,
        20
      ]
    ],
    [
      "WEST COOLING RUN",
      "CENTRAL TURBINE",
      "EAST IRON WALL",
      "NORTH OVERFLOW"
    ],
    [
      5,
      22
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        27,
        20
      ]
    ]
  ],
  [
    "orbitfall-array",
    "Orbitfall Array",
    "THE FALLEN SATELLITE",
    "matrix-facility",
    "#a5ffa1",
    "#ffd18b",
    "Downlinks from a fallen satellite point toward the last machine. A high maintenance gallery holds evidence.",
    [
      [
        2,
        3,
        10,
        11
      ],
      [
        24,
        3,
        32,
        11
      ],
      [
        2,
        18,
        10,
        25
      ],
      [
        24,
        18,
        32,
        25
      ],
      [
        10,
        8,
        25,
        21
      ],
      [
        5,
        13,
        29,
        16
      ],
      [
        15,
        3,
        19,
        25
      ]
    ],
    [
      "NORTH ANTENNA",
      "FALLEN ORBITAL CORE",
      "SOUTH GATE",
      "MAINTENANCE GALLERY"
    ],
    [
      5,
      23
    ],
    [
      28,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        28,
        20
      ],
      [
        17,
        10
      ]
    ],
    "deck"
  ],
  [
    "midnight-junction",
    "Midnight Junction",
    "THE INTERLOCKED LINES",
    "cyberpunk",
    "#8ddaff",
    "#fd86a9",
    "A web of rail junctions crosses the final network. The red route offers a dangerous shortcut.",
    [
      [
        2,
        2,
        8,
        25
      ],
      [
        13,
        2,
        19,
        25
      ],
      [
        25,
        2,
        32,
        25
      ],
      [
        6,
        4,
        28,
        7
      ],
      [
        6,
        11,
        28,
        14
      ],
      [
        6,
        19,
        28,
        22
      ],
      [
        9,
        8,
        24,
        10
      ],
      [
        10,
        15,
        23,
        18
      ]
    ],
    [
      "EAST SWITCH",
      "WEST SWITCH",
      "MIDNIGHT CROSSING",
      "NIGHT TRAIN"
    ],
    [
      5,
      23
    ],
    [
      28,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        16,
        12
      ],
      [
        28,
        20
      ]
    ],
    "red"
  ],
  [
    "human-frequency",
    "Human Frequency",
    "THE LAST LIVING SIGNAL",
    "corporate",
    "#a8e7ec",
    "#e7a5d7",
    "The last human transmission reaches a hidden observation room. Find the upstairs evidence before the silence.",
    [
      [
        2,
        4,
        10,
        25
      ],
      [
        24,
        4,
        32,
        25
      ],
      [
        9,
        3,
        25,
        8
      ],
      [
        9,
        20,
        25,
        25
      ],
      [
        11,
        9,
        23,
        19
      ],
      [
        5,
        13,
        29,
        16
      ],
      [
        15,
        6,
        19,
        23
      ]
    ],
    [
      "HUMAN COMMONS",
      "NORTH ARCHIVE",
      "RESTORATION HALL",
      "LAST OBSERVATION"
    ],
    [
      5,
      22
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        28,
        7
      ],
      [
        17,
        20
      ]
    ],
    "deck"
  ],
  [
    "last-relay-core",
    "The Last Relay",
    "THE FINAL CONTROL SIGNAL",
    "matrix-facility",
    "#f6a48e",
    "#7af9d8",
    "Three false broadcasts keep the Matrix running. Break the feeds, recover gold and face the Final Warden.",
    [
      [
        13,
        9,
        23,
        21
      ],
      [
        2,
        9,
        13,
        15
      ],
      [
        23,
        9,
        33,
        15
      ],
      [
        14,
        2,
        22,
        9
      ],
      [
        14,
        20,
        22,
        25
      ],
      [
        2,
        3,
        11,
        8
      ],
      [
        25,
        3,
        33,
        8
      ],
      [
        2,
        18,
        11,
        25
      ],
      [
        25,
        18,
        33,
        25
      ],
      [
        7,
        5,
        9,
        24
      ],
      [
        27,
        5,
        29,
        24
      ],
      [
        5,
        5,
        31,
        8
      ],
      [
        5,
        21,
        31,
        24
      ]
    ],
    [
      "WEST FALSE FEED",
      "EAST FALSE FEED",
      "THE RELAY HEART",
      "FINAL TRANSMISSION"
    ],
    [
      17,
      23
    ],
    [
      29,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        28,
        6
      ],
      [
        18,
        12
      ]
    ],
    "boss"
  ]
];

function carve(g,r){const [a,b,c,d]=r;for(let y=b;y<=d;y++)for(let x=a;x<=c;x++)if(x>0&&x<W-1&&y>0&&y<H-1)g[y][x]=".";}

function reach(g,origin){const visited=new Set([origin.join(",")]),q=[origin];for(let n=0;n<q.length;n++){const [x,y]=q[n];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy,k=X+","+Y;if(g[Y]?.[X]==="."&&!visited.has(k)){visited.add(k);q.push([X,Y]);}}}return q;}

function floorList(g){const a=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]===".")a.push([x,y]);return a;}

function near(points,target,used=new Set(),min=0){const options=points.filter(p=>!used.has(p.join(","))&&Math.hypot(p[0]-target[0],p[1]-target[1])>=min);if(!options.length)throw Error("No floor near "+target);options.sort((a,b)=>Math.abs(a[0]-target[0])+Math.abs(a[1]-target[1])-(Math.abs(b[0]-target[0])+Math.abs(b[1]-target[1]))||a[1]-b[1]||a[0]-b[0]);const p=options[0];used.add(p.join(","));return [p[0]+.5,p[1]+.5];}

function connect(g,origin){let visited=reach(g,origin),all=floorList(g);while(visited.length!==all.length){const have=new Set(visited.map(x=>x.join(","))),away=all.filter(p=>!have.has(p.join(",")));if(!away.length)break;let best=null;for(const a of visited)for(const b of away){const d=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);if(best===null||d<best.d)best={a,b,d};}if(!best)throw Error("Could not join district");let [x,y]=best.a;const [xx,yy]=best.b;while(x!==xx){x+=Math.sign(xx-x);g[y][x]=".";}while(y!==yy){y+=Math.sign(yy-y);g[y][x]=".";}visited=reach(g,origin);all=floorList(g);}return visited;}

function pocket(g,glyph,goal,walkers,optional=false){
 const set=new Set(walkers.map(p=>p.join(","))),choices=[];
 for(let y=3;y<H-3;y++)for(let x=3;x<W-4;x++){
  if(g[y][x]!=="#"||g[y][x-1]!=="."||!set.has((x-1)+","+y)||g[y][x+1]!=="#"||g[y][x+2]!=="#"||g[y][x+3]!=="#")continue;
  if(g[y-1][x]!=="#"||g[y+1][x]!=="#")continue;
  // Preserve a one-tile neck and a sealed two-tile pocket.
  if([1,2].some(dx=>g[y-1][x+dx]!=="#"||g[y+1][x+dx]!=="#"))continue;
  choices.push([x,y]);
 }
 if(!choices.length){
  // Some narrow crypts have no solid three-cell wall pocket. Place a
  // deliberately isolated service annex along the sealed southern edge.
  // All access runs on normal walkable tiles; a door remains the only entry.
  const slots={"$":7,"?":17,"+":27,r:23,b:23,g:23};
  const x=slots[glyph];
  if(!x)throw Error("No annex slot for "+glyph);
  const source=walkers.reduce((best,p)=>!best||
    Math.abs(p[0]-x)+Math.abs(p[1]-25)<Math.abs(best[0]-x)+Math.abs(best[1]-25)?p:best,null);
  if(!source)throw Error("No reachable approach for "+glyph);
  let [cx,cy]=source;
  while(cy<26){cy++;if(g[cy][cx]==="#")g[cy][cx]=".";}
  while(cx!==x){cx+=Math.sign(x-cx);if(g[26][cx]==="#")g[26][cx]=".";}
  if(g[27][x]!=="#"||g[28][x]!=="#"||
      g[27][x-1]!=="#"||g[27][x+1]!=="#")
    throw Error("Reserved annex lacks safe clearance for "+glyph);
  g[27][x]=glyph;
  g[28][x]=".";
  return [x+.5,28.5];
 }
 choices.sort((a,b)=>Math.abs(a[0]-goal[0])+Math.abs(a[1]-goal[1])-(Math.abs(b[0]-goal[0])+Math.abs(b[1]-goal[1])));
 const [x,y]=choices[0];g[y][x]=glyph;g[y][x+1]=".";g[y][x+2]=".";return [x+2.5,y+.5];
}

function deck(g,occupied){
 const choices=[];
 for(let y=5;y<21;y++)for(let x=9;x<27;x++){
  const region=[];for(let yy=y;yy<y+4;yy++)for(let xx=x;xx<x+5;xx++)region.push([xx,yy]);
  for(let yy=y+1;yy<y+3;yy++)for(let xx=x-5;xx<x;xx++)region.push([xx,yy]);
  if(region.some(([X,Y])=>g[Y]?.[X]!=="."))continue;
  let blocked=false;for(let yy=y+1;yy<y+3;yy++)for(let xx=x-3;xx<x;xx++)if(occupied.has(xx+","+yy))blocked=true;
  if(!blocked)choices.push({x,y,d:Math.abs(x-16)+Math.abs(y-13)});
 }
 if(!choices.length)throw Error("No safe accessible three-tile ramp");
 choices.sort((a,b)=>a.d-b.d);const {x,y}=choices[0];return {upper:{x0:x,y0:y,x1:x+5,y1:y+4},ramp:{x0:x-3,y0:y+1,x1:x,y1:y+3},items:[["artifact",x+2.5,y+2.5],["energy",x+3.5,y+1.5]]};
}

function wallSign(g,goal){const arr=[];for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){if(g[y][x]!=="#")continue;if([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>g[y+dy][x+dx]==="."))arr.push([x,y]);}arr.sort((a,b)=>Math.abs(a[0]-goal[0])+Math.abs(a[1]-goal[1])-Math.abs(b[0]-goal[0])-Math.abs(b[1]-goal[1]));if(!arr.length)throw Error("No wall for lore");return arr[0];}

function makeStage(p,i){
 const [id,name,tag,material,c1,c2,subtitle,areas,labels,spawnAt,keyAt,relayAt,extra]=p;
 const g=Array.from({length:H},()=>Array(W).fill("#"));areas.forEach(r=>carve(g,r));
 const first=floorList(g),start=near(first,spawnAt),main=connect(g,[Math.floor(start[0]),Math.floor(start[1])]);
 const exit=pocket(g,"$",[29,5+i%16],main),secret=pocket(g,"?",[29,21-i%14],main);
 const side=pocket(g,"+",[29,12],main,true);
 const color=["red","blue","green"].includes(extra)?extra:null;
 const colorPocket=color?pocket(g,{red:"r",blue:"b",green:"g"}[color],[29,14],main,true):null;
 const used=new Set([[Math.floor(start[0]),Math.floor(start[1])].join(",")]),pick=(pos,min=0)=>near(main,pos,used,min);
 const relays=relayAt.map(pick),key=pick(keyAt);
 const captives=[[7,7],[26,20]].map(pick);
 const anchors=[[7,18],[26,18],[6,6],[25,6],[16,12],[11,19],[21,15],[14,5],[22,9],[9,13],[17,20]];
 const roster=["plugged","repeater","crawler","enforcer","repeater","crawler","enforcer","plugged","repeater","enforcer","crawler"];
 const enemies=anchors.slice(0,i<3?7:i<6?9:11).map((pos,j)=>[roster[j],...pick(pos,3)]);
 if(extra==="boss")enemies.push(["warden",...pick([17,12],5)]);
 const items=[["armor",...pick([5,22])],["energy",...pick([10,20])],["health",...pick([4,11])],["energy",...pick([16,7])],["health",...pick([26,9])],
 ["energy",...pick([25,21])],["armor",...pick([20,19])],["energy",...pick([12,12])],["health",...pick([6,5])],["energy",...pick([22,5])]];
 if(side)items.push(["energy",...side]);
 if(colorPocket)items.push(["key:"+color,...pick([6,17])],["armor",...colorPocket]);
 if(extra==="deck")items.push(["energy",...secret]);else items.push(["artifact",...secret]);
 const vertical=extra==="deck"?deck(g,used):null;
 const props=[["lamp",...pick([7,10])],["console",...pick([26,15])],["speaker",...pick([16,16])],["pod",...pick([17,6])]];
 const signs=[[...wallSign(g,[13,9]),tag,"SIGNAL TRACE",subtitle],[...wallSign(g,[24,17]),"UNLISTED CITIZENS","RECOVERED MESSAGE","The final transmission is ours. Every human signal deserves to be free."]];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]==="#"&&[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>g[y+dy][x+dx]==="."))
  if((x+2*y+i)%9===0)g[y][x]="2";else if((2*x+y+i)%11===0)g[y][x]="3";
 return {id,name,tag,subtitle,material,palette:[c1,c2],secretName:name.toUpperCase()+" / HIDDEN ARCHIVE",map:g.map(row=>row.join("")),
  spawn:{x:start[0],y:start[1],a:-Math.PI/2},relays,key,exit,enemies,items,captives,rooms:areas.slice(0,4),
  theme:{rooms:labels,props,signs},difficulty:Math.min(1.14,.81+i*.041),tactics:Math.min(.34,.07+i*.034),
  ...(extra==="boss"?{bossName:"THE FINAL WARDEN"}:{}),...(vertical?{vertical}:{})};
}

export const LAST_RELAY={id:'last-relay',revision:1,title:'The Last Relay',

  summary:'Follow the final transmission across nine isolated relay complexes to free the last signal.',

  ending:'The Last Relay has fallen. No signal can command humanity to surrender its freedom.',

  stages:P.map(makeStage)};
