declare variable $requestId external;
declare variable $xquery external;

let $o := json:object()
let $_ :=
  try {
    map:put($o, "resp", dbg:value(xs:unsignedLong($requestId), $xquery)),
    map:put($o, "error", fn:false())
  }
  catch($e) {
    map:put($o, "resp", xdmp:quote($e, <options xmlns="xdmp:quote">
      <indent>yes</indent>
      <indent-untyped>yes</indent-untyped>
      <omit-xml-declaration>yes</omit-xml-declaration>
    </options>)),
    map:put($o, "error", fn:true())
  }
return
  xdmp:to-json($o)
