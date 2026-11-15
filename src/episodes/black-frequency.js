// Nine distinct authored transmission crypts, voice archives and signal temples.

// All doors and optional upper decks are validated by the episode registry at boot.

const W=37,H=30;

const P=[
  [
    "static-pilgrimage",
    "Static Pilgrimage",
    "THE SILENT ENTRY",
    "industrial",
    "#97dcce",
    "#edb47f",
    "Find the signal shrouded in the intake crypt. Shut the two feeder relays before entering the silent hall.",
    [
      [
        2,
        19,
        11,
        24
      ],
      [
        13,
        19,
        32,
        23
      ],
      [
        2,
        3,
        10,
        10
      ],
      [
        23,
        3,
        32,
        10
      ],
      [
        14,
        4,
        20,
        17
      ],
      [
        5,
        9,
        7,
        21
      ],
      [
        25,
        9,
        27,
        21
      ],
      [
        6,
        13,
        27,
        15
      ],
      [
        10,
        5,
        14,
        7
      ]
    ],
    [
      "ENTRY CRYPT",
      "DEAD TRANSMITTERS",
      "SILENT HALL",
      "NORTH SHRINE"
    ],
    [
      4,
      21
    ],
    [
      28,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        26,
        7
      ]
    ]
  ],
  [
    "resonance-crypt",
    "Resonance Crypt",
    "ARCHIVE OF LOST VOICES",
    "horror",
    "#e5a1cf",
    "#89d9ea",
    "The names of the erased are hidden in two archive wings. Follow the return circuit, not the whispers.",
    [
      [
        2,
        3,
        8,
        24
      ],
      [
        25,
        3,
        32,
        24
      ],
      [
        10,
        2,
        24,
        6
      ],
      [
        10,
        20,
        24,
        24
      ],
      [
        10,
        10,
        24,
        16
      ],
      [
        7,
        11,
        27,
        13
      ],
      [
        14,
        5,
        17,
        22
      ],
      [
        4,
        18,
        29,
        20
      ]
    ],
    [
      "WEST EPITAPHS",
      "EAST EPITAPHS",
      "RETURN CIRCUIT",
      "MEMORY CHOIR"
    ],
    [
      4,
      22
    ],
    [
      27,
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
      ]
    ]
  ],
  [
    "choir-of-copper",
    "Choir of Copper",
    "COPPER HARMONIC ARRAY",
    "matrix-facility",
    "#82f3d4",
    "#ca99ef",
    "Two oscillators feed a central choir engine. The upper balcony holds reserves but no mandatory controls.",
    [
      [
        2,
        3,
        11,
        10
      ],
      [
        23,
        3,
        32,
        10
      ],
      [
        2,
        17,
        12,
        24
      ],
      [
        23,
        17,
        32,
        24
      ],
      [
        10,
        6,
        26,
        22
      ],
      [
        4,
        12,
        30,
        15
      ],
      [
        16,
        2,
        20,
        25
      ]
    ],
    [
      "WEST OSCILLATOR",
      "EAST OSCILLATOR",
      "CHOIR ENGINE",
      "UPLINK FLOOR"
    ],
    [
      4,
      22
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
        27,
        7
      ]
    ],
    "deck"
  ],
  [
    "the-unheard",
    "The Unheard",
    "ABANDONED SIGNAL THEATRE",
    "horror",
    "#f28cb6",
    "#a3a6ff",
    "The audience is gone. Three empty viewing galleries still feed the broadcast. Blue access opens a side route.",
    [
      [
        2,
        18,
        12,
        24
      ],
      [
        23,
        18,
        32,
        24
      ],
      [
        11,
        3,
        24,
        23
      ],
      [
        3,
        4,
        13,
        9
      ],
      [
        23,
        4,
        32,
        9
      ],
      [
        5,
        10,
        28,
        12
      ],
      [
        5,
        15,
        28,
        17
      ]
    ],
    [
      "STAGE ZERO",
      "EMPTY BALCONIES",
      "PROJECTION LOOP",
      "THE UNHEARD"
    ],
    [
      5,
      22
    ],
    [
      27,
      5
    ],
    [
      [
        5,
        7
      ],
      [
        27,
        7
      ],
      [
        17,
        10
      ]
    ],
    "blue"
  ],
  [
    "null-procession",
    "Null Procession",
    "DECOMMISSIONED SERVICE TUNNELS",
    "industrial",
    "#edc08c",
    "#7de8cd",
    "March through the maze of service tunnels. A forgotten cache is somewhere behind the numbered walls.",
    [
      [
        2,
        3,
        6,
        25
      ],
      [
        10,
        3,
        14,
        25
      ],
      [
        18,
        3,
        22,
        25
      ],
      [
        26,
        3,
        31,
        25
      ],
      [
        5,
        4,
        29,
        6
      ],
      [
        5,
        12,
        29,
        14
      ],
      [
        5,
        21,
        29,
        23
      ],
      [
        3,
        9,
        13,
        10
      ],
      [
        20,
        16,
        30,
        18
      ]
    ],
    [
      "LEFT FEED",
      "SECOND FEED",
      "THIRD FEED",
      "PROCESSION GATE"
    ],
    [
      4,
      23
    ],
    [
      28,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        28,
        21
      ]
    ]
  ],
  [
    "cathedral-of-noise",
    "Cathedral of Noise",
    "OVERTONE CONVERSION COMPLEX",
    "cyberpunk",
    "#79dfff",
    "#e189ff",
    "Climb the optional gallery to find the countertone while three ground-level feeds roar below.",
    [
      [
        2,
        3,
        11,
        11
      ],
      [
        23,
        3,
        32,
        11
      ],
      [
        2,
        18,
        11,
        25
      ],
      [
        23,
        18,
        32,
        25
      ],
      [
        9,
        7,
        28,
        23
      ],
      [
        12,
        4,
        25,
        24
      ],
      [
        5,
        13,
        30,
        15
      ]
    ],
    [
      "OVERTONE CHAPEL",
      "LOWER RESONATOR",
      "COUNTERTONE GALLERY",
      "SOUTH NAVE"
    ],
    [
      5,
      23
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
        27,
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
    "fracture-array",
    "Fracture Array",
    "BROKEN FREQUENCY MATRIX",
    "corporate",
    "#bbd6fa",
    "#fd97a9",
    "The signal is fragmented into three observatories. The red service key unlocks an optional bypass.",
    [
      [
        2,
        3,
        10,
        9
      ],
      [
        13,
        3,
        22,
        9
      ],
      [
        25,
        3,
        32,
        9
      ],
      [
        3,
        12,
        14,
        19
      ],
      [
        19,
        12,
        31,
        19
      ],
      [
        2,
        22,
        12,
        25
      ],
      [
        22,
        22,
        32,
        25
      ],
      [
        10,
        7,
        13,
        24
      ],
      [
        19,
        7,
        22,
        24
      ],
      [
        5,
        15,
        29,
        17
      ]
    ],
    [
      "OBSERVATORY A",
      "OBSERVATORY B",
      "SPLIT SIGNAL",
      "REPAIR LOOP"
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
        5
      ],
      [
        27,
        5
      ],
      [
        20,
        17
      ]
    ],
    "red"
  ],
  [
    "oracle-engine",
    "Oracle Engine",
    "PREDICTION CORE",
    "cyberpunk",
    "#a998fa",
    "#7fffe0",
    "The machine thinks it knows your route. An upper walkway still carries the evidence it failed to erase.",
    [
      [
        2,
        3,
        9,
        24
      ],
      [
        24,
        3,
        32,
        24
      ],
      [
        10,
        3,
        23,
        7
      ],
      [
        10,
        20,
        23,
        24
      ],
      [
        9,
        9,
        26,
        18
      ],
      [
        3,
        12,
        30,
        15
      ],
      [
        15,
        3,
        18,
        24
      ]
    ],
    [
      "PREDICTION CHAMBER",
      "FALSE FUTURES",
      "CORE WALKWAY",
      "ORACLE OUTPUT"
    ],
    [
      5,
      22
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
        27,
        7
      ],
      [
        16,
        20
      ]
    ],
    "deck"
  ],
  [
    "zero-transmission",
    "Zero Transmission",
    "BLACK FREQUENCY SOURCE",
    "matrix-facility",
    "#fb887c",
    "#77f5f0",
    "Destroy three anchor broadcasts, recover the golden override and silence the Black Warden.",
    [
      [
        13,
        9,
        23,
        20
      ],
      [
        2,
        9,
        13,
        14
      ],
      [
        23,
        9,
        33,
        14
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
        6,
        9,
        23
      ],
      [
        27,
        6,
        29,
        23
      ],
      [
        5,
        6,
        31,
        8
      ],
      [
        5,
        21,
        31,
        23
      ]
    ],
    [
      "FINAL TRANSMISSION",
      "WEST RECEIVER",
      "EAST RECEIVER",
      "SOURCE CHAMBER"
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
        29,
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
 if(!choices.length){if(optional)return null;throw Error("No sealed door location for "+glyph);}
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
 const signs=[[...wallSign(g,[13,9]),tag,"SIGNAL TRACE",subtitle],[...wallSign(g,[24,17]),"UNLISTED CITIZENS","RECOVERED MESSAGE","Their names survived the silence. No mind belongs to the signal."]];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]==="#"&&[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>g[y+dy][x+dx]==="."))
  if((x+2*y+i)%9===0)g[y][x]="2";else if((2*x+y+i)%11===0)g[y][x]="3";
 return {id,name,tag,subtitle,material,palette:[c1,c2],secretName:name.toUpperCase()+" / HIDDEN ARCHIVE",map:g.map(row=>row.join("")),
  spawn:{x:start[0],y:start[1],a:-Math.PI/2},relays,key,exit,enemies,items,captives,rooms:areas.slice(0,4),
  theme:{rooms:labels,props,signs},difficulty:Math.min(1.14,.81+i*.041),tactics:Math.min(.34,.07+i*.034),
  ...(extra==="boss"?{bossName:"THE BLACK WARDEN"}:{}),...(vertical?{vertical}:{})};
}

export const BLACK_FREQUENCY={id:'black-frequency',revision:1,title:'The Black Frequency',

  summary:'Follow the corrupted frequencies through abandoned signal temples to their source.',

  ending:'The Black Warden is down. Voices trapped in the signal are free to speak again.',

  stages:P.map(makeStage)};
