// Nine distinct authored district plans, compiled into native ASCII episode maps.

// All doors and optional upper decks are validated by the episode registry at boot.

const W=37,H=30;

const P=[
  [
    "arrival-curfew",
    "Arrival Curfew",
    "NEON BORDER TERMINAL",
    "corporate",
    "#92eafb",
    "#f3a673",
    "The arrival gate is screening citizens. Cut the checkpoint feeds and recover gold.",
    [
      [
        2,
        19,
        12,
        23
      ],
      [
        12,
        18,
        30,
        23
      ],
      [
        2,
        3,
        11,
        9
      ],
      [
        21,
        3,
        30,
        10
      ],
      [
        13,
        5,
        20,
        17
      ],
      [
        5,
        9,
        8,
        20
      ],
      [
        24,
        10,
        27,
        20
      ],
      [
        7,
        12,
        25,
        14
      ]
    ],
    [
      "ARRIVAL QUEUE",
      "CARGO APRON",
      "CHECKPOINT OFFICE",
      "EAST CUSTOMS"
    ],
    [
      4,
      21
    ],
    [
      26,
      5
    ],
    [
      [
        5,
        6
      ],
      [
        23,
        6
      ]
    ]
  ],
  [
    "ring-of-adverts",
    "Ring of Adverts",
    "HOLOGRAM DISTRIBUTION",
    "cyberpunk",
    "#ff6bc1",
    "#70f0e7",
    "The advertising ring loops forever. Break the two anchors on opposite sides of the central court.",
    [
      [
        2,
        3,
        30,
        5
      ],
      [
        2,
        21,
        30,
        23
      ],
      [
        2,
        3,
        5,
        23
      ],
      [
        27,
        3,
        30,
        23
      ],
      [
        11,
        7,
        21,
        18
      ],
      [
        4,
        12,
        28,
        14
      ],
      [
        15,
        4,
        17,
        22
      ]
    ],
    [
      "NORTH ADWALK",
      "SOUTH ADWALK",
      "DEAD PLAZA",
      "RING SPINE"
    ],
    [
      4,
      21
    ],
    [
      28,
      4
    ],
    [
      [
        4,
        5
      ],
      [
        28,
        21
      ]
    ]
  ],
  [
    "midnight-concourse",
    "Midnight Concourse",
    "CLOSED CITY METRO",
    "industrial",
    "#e9b15a",
    "#6be7ce",
    "Twin rails flank the concourse. Supplies upstairs are optional, the ground signals are not.",
    [
      [
        2,
        4,
        9,
        22
      ],
      [
        12,
        2,
        20,
        24
      ],
      [
        23,
        4,
        30,
        22
      ],
      [
        8,
        8,
        25,
        10
      ],
      [
        8,
        17,
        25,
        19
      ],
      [
        4,
        12,
        28,
        14
      ],
      [
        9,
        10,
        24,
        16
      ]
    ],
    [
      "WEST PLATFORM",
      "CENTRAL CONCOURSE",
      "EAST PLATFORM",
      "TRANSFER TUNNEL"
    ],
    [
      4,
      21
    ],
    [
      26,
      6
    ],
    [
      [
        4,
        6
      ],
      [
        26,
        18
      ]
    ],
    "deck"
  ],
  [
    "sundown-offices",
    "Sundown Offices",
    "CORPORATE NIGHT SHIFT",
    "corporate",
    "#92ccef",
    "#ffe0a8",
    "The boardroom never clocks out. A blue-badge service passage cuts through the night shift.",
    [
      [
        2,
        3,
        16,
        7
      ],
      [
        16,
        5,
        30,
        9
      ],
      [
        9,
        9,
        22,
        13
      ],
      [
        2,
        14,
        18,
        18
      ],
      [
        17,
        17,
        30,
        21
      ],
      [
        3,
        21,
        16,
        24
      ],
      [
        14,
        7,
        17,
        22
      ],
      [
        5,
        6,
        7,
        15
      ]
    ],
    [
      "RECEPTION",
      "DIRECTOR SUITES",
      "AFTER-HOURS HALL",
      "SERVER FLOOR"
    ],
    [
      5,
      22
    ],
    [
      28,
      7
    ],
    [
      [
        4,
        5
      ],
      [
        26,
        19
      ]
    ],
    "blue"
  ],
  [
    "the-mall-after",
    "The Mall After",
    "EMPTY RETAIL LOOP",
    "horror",
    "#ff7e99",
    "#9ddefa",
    "The mall lights are still on. The only honest price left is the exit.",
    [
      [
        2,
        4,
        13,
        22
      ],
      [
        20,
        4,
        30,
        22
      ],
      [
        12,
        5,
        22,
        7
      ],
      [
        12,
        12,
        22,
        15
      ],
      [
        12,
        20,
        22,
        22
      ],
      [
        4,
        2,
        27,
        4
      ]
    ],
    [
      "WEST ARCADE",
      "EAST ARCADE",
      "FOOD COURT",
      "SERVICE SKYWAY"
    ],
    [
      4,
      20
    ],
    [
      27,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        26,
        19
      ]
    ]
  ],
  [
    "skybridge-cascade",
    "Skybridge Cascade",
    "VERTICAL UTILITY CROSSING",
    "cyberpunk",
    "#84dfff",
    "#ff89e7",
    "Three high-rises feed the bridge. Take the optional upper cache while disabling city uplinks.",
    [
      [
        2,
        14,
        30,
        24
      ],
      [
        3,
        3,
        10,
        13
      ],
      [
        13,
        2,
        20,
        13
      ],
      [
        23,
        3,
        30,
        13
      ],
      [
        7,
        9,
        26,
        11
      ],
      [
        14,
        7,
        18,
        21
      ],
      [
        8,
        15,
        24,
        20
      ]
    ],
    [
      "LOWER PROMENADE",
      "WEST STACK",
      "CENTRAL SKYBRIDGE",
      "EAST STACK"
    ],
    [
      4,
      22
    ],
    [
      26,
      5
    ],
    [
      [
        5,
        5
      ],
      [
        17,
        4
      ],
      [
        27,
        21
      ]
    ],
    "deck"
  ],
  [
    "firewall-boulevard",
    "Firewall Boulevard",
    "CENSORED MAIN STREET",
    "matrix-facility",
    "#72ffbb",
    "#e99a7e",
    "Three monitored avenues. A red maintenance badge opens the quiet bypass.",
    [
      [
        3,
        3,
        7,
        24
      ],
      [
        13,
        2,
        17,
        24
      ],
      [
        25,
        3,
        29,
        24
      ],
      [
        5,
        4,
        28,
        6
      ],
      [
        6,
        14,
        27,
        17
      ],
      [
        4,
        21,
        28,
        23
      ],
      [
        9,
        8,
        23,
        10
      ]
    ],
    [
      "WEST WATCH",
      "MAIN BOULEVARD",
      "EAST WATCH",
      "CHECKPOINT CROSSING"
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
        5
      ],
      [
        15,
        13
      ],
      [
        27,
        21
      ]
    ],
    "red"
  ],
  [
    "identity-arcology",
    "Identity Arcology",
    "REASSIGNMENT HOUSING",
    "horror",
    "#d8a9ff",
    "#87d9e9",
    "Every apartment is numbered, none has a name. The upper atrium keeps unregistered supplies.",
    [
      [
        2,
        2,
        8,
        8
      ],
      [
        10,
        2,
        16,
        8
      ],
      [
        18,
        2,
        24,
        8
      ],
      [
        26,
        2,
        30,
        8
      ],
      [
        2,
        10,
        8,
        16
      ],
      [
        10,
        10,
        16,
        16
      ],
      [
        18,
        10,
        24,
        16
      ],
      [
        26,
        10,
        30,
        16
      ],
      [
        2,
        18,
        8,
        24
      ],
      [
        10,
        18,
        16,
        24
      ],
      [
        18,
        18,
        24,
        24
      ],
      [
        26,
        18,
        30,
        24
      ],
      [
        7,
        7,
        27,
        10
      ],
      [
        7,
        15,
        27,
        18
      ],
      [
        6,
        5,
        10,
        22
      ],
      [
        16,
        5,
        20,
        22
      ],
      [
        24,
        5,
        27,
        22
      ],
      [
        9,
        11,
        25,
        16
      ]
    ],
    [
      "RESIDENTIAL BLOCK A",
      "IDENTITY KIOSKS",
      "CENTRAL ATRIUM",
      "MEMORY REASSIGNMENT"
    ],
    [
      4,
      22
    ],
    [
      28,
      4
    ],
    [
      [
        5,
        4
      ],
      [
        20,
        4
      ],
      [
        27,
        21
      ]
    ],
    "deck"
  ],
  [
    "crown-broadcast",
    "Crown Broadcast",
    "THE LAST CITY FREQUENCY",
    "matrix-facility",
    "#fa8769",
    "#65fff1",
    "Three feeds sustain the false city signal. Recover gold and bring down the Crown Warden.",
    [
      [
        11,
        8,
        21,
        19
      ],
      [
        2,
        10,
        12,
        14
      ],
      [
        20,
        10,
        30,
        14
      ],
      [
        14,
        2,
        18,
        9
      ],
      [
        14,
        18,
        18,
        24
      ],
      [
        2,
        3,
        9,
        7
      ],
      [
        23,
        3,
        30,
        7
      ],
      [
        2,
        18,
        9,
        23
      ],
      [
        23,
        18,
        30,
        23
      ],
      [
        5,
        5,
        7,
        22
      ],
      [
        25,
        5,
        27,
        22
      ],
      [
        5,
        5,
        27,
        7
      ],
      [
        5,
        20,
        27,
        22
      ]
    ],
    [
      "BROADCAST CORE",
      "WEST FEED",
      "EAST FEED",
      "CROWN SIGNAL"
    ],
    [
      16,
      22
    ],
    [
      26,
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
        16,
        11
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
 const signs=[[...wallSign(g,[13,9]),tag,"SIGNAL TRACE",subtitle],[...wallSign(g,[24,17]),"UNLISTED CITIZENS","RECOVERED MESSAGE","No identity belongs to the corporation. No voice belongs to the signal."]];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]==="#"&&[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>g[y+dy][x+dx]==="."))
  if((x+2*y+i)%9===0)g[y][x]="2";else if((2*x+y+i)%11===0)g[y][x]="3";
 return {id,name,tag,subtitle,material,palette:[c1,c2],secretName:name.toUpperCase()+" / HIDDEN ARCHIVE",map:g.map(row=>row.join("")),
  spawn:{x:start[0],y:start[1],a:-Math.PI/2},relays,key,exit,enemies,items,captives,rooms:areas.slice(0,4),
  theme:{rooms:labels,props,signs},difficulty:Math.min(1.14,.81+i*.041),tactics:Math.min(.34,.07+i*.034),
  ...(extra==="boss"?{bossName:"THE CROWN WARDEN"}:{}),...(vertical?{vertical}:{})};
}

export const SYNTHETIC_CITY={id:'synthetic-city',revision:1,title:'Synthetic City',

  summary:'Cross the artificial metropolis from its curfew gates to the Crown Broadcast.',

  ending:'The Crown Broadcast is silent. The city can finally hear its own people again.',

  stages:P.map(makeStage)};
