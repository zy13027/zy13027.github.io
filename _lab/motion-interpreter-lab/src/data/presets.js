export function renderSourceLines(container, lines){
  container.textContent = "";
  lines.forEach(function(text, idx){
    var row = document.createElement("div");
    row.className = "line";
    row.dataset.line = String(idx+1);
    var ln = document.createElement("span");
    ln.className = "ln";
    ln.textContent = String(idx+1);
    var body = document.createElement("span");
    var cIdx = text.indexOf("//");
    if(cIdx >= 0){
      body.appendChild(document.createTextNode(text.slice(0,cIdx)));
      var cm = document.createElement("span");
      cm.className = "cm";
      cm.textContent = text.slice(cIdx);
      body.appendChild(cm);
    }else{
      body.textContent = text;
    }
    row.appendChild(ln);
    row.appendChild(body);
    container.appendChild(row);
  });
}

export function buildPreset1(){
  var src = [
    "PROGRAM main",
    "  VAR_IPR CONSTANT",
    "    PickPosition   : TO_Struct_Ipr_Position := (x:=0, y:=0, z:=0);",
    "    PlacePosOrigin : TO_Struct_Ipr_Position := (x:=20.0, y:=20.0);",
    "    ProductGapX    : LREAL := 20.0;",
    "    ProductGapY    : LREAL := 25.0;",
    "    MASK           : DWORD := 32; // Mask for bit 5",
    "  END_VAR",
    "",
    "  VAR",
    "    iterateX : DINT;",
    "    iterateY : DINT;",
    "  END_VAR",
    "",
    "  powerOn( );",
    "",
    "  IF (($A1.StatusWord AND MASK)) <> 32 THEN // home if axes are not homed yet",
    "    home( $A1 );",
    "    home( $A2 );",
    "    home( $A3 );",
    "  END_IF;",
    "",
    "  setTrans( 2 );",
    "  setBlend( 2 );",
    "  setBlendDist( 4.0 );",
    "",
    "  FOR iterateX := 0 TO 2 DO",
    "    FOR iterateY := 0 TO 2 DO",
    "      linAbs( PickPosition );",
    "      Grip();",
    "      linRel( (z := 50.0) );",
    "      linAbs( (x := PlacePosOrigin.x + ProductGapX * iterateX,",
    "               y := PlacePosOrigin.y + ProductGapY * iterateY) );",
    "      linRel( (z := -50.0) );",
    "      Release();",
    "      linRel( (z := 35.0) );",
    "      linAbs( (x := PickPosition.x, y := PickPosition.y) );",
    "    END_FOR;",
    "  END_FOR;",
    "",
    "  linAbs( PickPosition );",
    "",
    "END_PROGRAM",
    "",
    "FUNCTION Grip : VOID",
    "  writeVar( OpenGripper, FALSE );",
    "  writeVar( CloseGripper, TRUE );",
    "  waitEvent( GripperClosed );",
    "END_FUNCTION",
    "",
    "FUNCTION Release : VOID",
    "  writeVar( CloseGripper, FALSE );",
    "  writeVar( OpenGripper, TRUE );",
    "  waitEvent( GripperOpened );",
    "END_FUNCTION"
  ];

  var jobs = [];
  var pos = {x:0,y:0,z:0};
  function flow(line, ms){ jobs.push({line:line, type:"flow", x:pos.x,y:pos.y,z:pos.z, ms:ms||120}); }
  function move(line, nx, ny, nz){
    if(nx!==undefined) pos.x = nx;
    if(ny!==undefined) pos.y = ny;
    if(nz!==undefined) pos.z = nz;
    jobs.push({line:line, type:"move", x:pos.x,y:pos.y,z:pos.z});
  }
  function pause(line, label, ms){
    jobs.push({line:line, type:"pause", x:pos.x,y:pos.y,z:pos.z, pauseLabel:label, pauseMs:ms});
  }

  flow(15, 160);          // powerOn()
  flow(18, 90); flow(19, 90); flow(20, 90); // home x3
  flow(23, 90); flow(24, 90); flow(25, 90); // setTrans/setBlend/setBlendDist

  var placeOriginX = 20.0, placeOriginY = 20.0, gapX = 20.0, gapY = 25.0;
  for(var ix=0; ix<3; ix++){
    for(var iy=0; iy<3; iy++){
      move(29, 0, 0, 0);                       // linAbs( PickPosition )
      pause(30, "Grip(): waiting GripperClosed", 400);
      move(31, undefined, undefined, pos.z+50);        // linRel( z:=50 )
      move(32, placeOriginX + gapX*ix, placeOriginY + gapY*iy, undefined); // linAbs place xy
      move(34, undefined, undefined, pos.z-50);        // linRel( z:=-50 )
      pause(35, "Release(): waiting GripperOpened", 200);
      move(36, undefined, undefined, pos.z+35);         // linRel( z:=35 )
      move(37, 0, 0, undefined);                        // linAbs back to pick xy
    }
  }
  move(41, 0, 0, 0); // final linAbs( PickPosition )
  flow(43, 90); // END_PROGRAM

  return { src:src, jobs:jobs, is3d:true, nominalV:80 };
}

export function buildPreset2(){
  var src = [
    "PROGRAM main",
    "  VAR CONSTANT",
    "    p1 : TO_Struct_Ipr_Position := (x:=0,   y:=0);",
    "    p2 : TO_Struct_Ipr_Position := (x:=120, y:=0);",
    "    p3 : TO_Struct_Ipr_Position := (x:=120, y:=80);",
    "    p4 : TO_Struct_Ipr_Position := (x:=0,   y:=80);",
    "  END_VAR",
    "  setDynMax( v := 100.0, a := 10000.0, d := 10000.0, j := 10000.0 );",
    "  setDyn( v := 60.0, a := 2000.0, d := 3000.0, j := 10000.0 );",
    "  linAbs( p1 );",
    "  linAbs( p2, trans := 2, blend := 2, blendDist := 15.0 );",
    "  linAbs( p3, trans := 2 );",
    "  linAbs( p4, trans := 0 );",
    "  linAbs( p1 );",
    "END_PROGRAM"
  ];
  var jobs = [];
  jobs.push({line:8, type:"flow", x:0,y:0,z:0, ms:90});
  jobs.push({line:9, type:"flow", x:0,y:0,z:0, ms:90});
  jobs.push({line:10, type:"move", x:0,y:0,z:0});
  jobs.push({line:11, type:"move", x:120,y:0,z:0});
  jobs.push({line:12, type:"move", x:120,y:80,z:0});
  jobs.push({line:13, type:"move", x:0,y:80,z:0});
  jobs.push({line:14, type:"move", x:0,y:0,z:0});
  return { src:src, jobs:jobs, is3d:false, nominalV:60 };
}

export function buildPreset3(){
  var src = [
    "PROGRAM main",
    "  VAR",
    "    Pos1 : TO_Struct_Ipr_Position;",
    "  END_VAR",
    "  // set max. values for dynamic",
    "  setDynMax( v := 100.0, a := 10000.0, d := 10000.0, j := 10000.0 );",
    "  // set dynamic parameters modally",
    "  setDyn( a := 2000.0, d := 3000.0, j := 10000.0 );",
    "  // linear movement of Kinematics to Pos1 with modal parameters (a, d, j),",
    "  // specified with \"setDyn()\" and velocity specified in \"linAbs()\"",
    "  linAbs( Pos1, v := 50.0 );",
    "END_PROGRAM"
  ];
  var jobs = [];
  jobs.push({line:6, type:"flow", x:10,y:10,z:0, ms:110});
  jobs.push({line:8, type:"flow", x:10,y:10,z:0, ms:110});
  jobs.push({line:11, type:"move", x:70,y:45,z:0, v:50});
  return { src:src, jobs:jobs, is3d:false, nominalV:50, illustrative:true };
}
