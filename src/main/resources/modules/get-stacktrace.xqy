declare variable $requestId external;

declare function local:build-var-array($vars) {
  let $array := json:array()
  let $_ :=
    for $var in $vars
    return
      json:array-push($array, map:new((
        map:entry("name", $var/*:name/fn:data()),
        map:entry("prefix", $var/*:prefix/fn:data()),
        map:entry("value", $var/*:value/fn:data())
      )))
  return
    $array
};

let $stack := dbg:stack(xs:unsignedLong($requestId))
let $e := json:array()
let $_ :=
  for $expr at $i in $stack/*:expr
  let $uri := $expr/*:uri/fn:data()
  let $is-qconsole :=
    (
      fn:string-length($uri) eq 0 and
      ($stack/*:frame/*:uri = "/MarkLogic/appservices/qconsole/qconsole-amped.xqy")
    )
  let $expression := map:new((
    map:entry("expressionId", $expr/*:expr-id/fn:data()),
    map:entry("expressionSource", $expr/*:expr-source/fn:data()),
    map:entry("uri", $uri),
    map:entry("type",
      if ($is-qconsole) then
        "xdmp:eval"
      else if ($uri = "/eval") then
        "invoke"
      else
        ""),
    if ($is-qconsole) then
      map:entry("evalSource", dbg:value(xs:unsignedLong($requestId), "xdmp:get-request-body()"))
    else (),
    map:entry("location", map:new((
      map:entry("database", $expr/*:location/*:database/fn:data()),
      map:entry("uri", $expr/*:location/*:uri/fn:data())
    ))),
    map:entry("line", $expr/*:line/fn:data()),
    map:entry("column", $expr/*:column/fn:data()),
    map:entry("globalVariables", local:build-var-array($expr/*:global-variables/*:global-variable)),
    map:entry("externalVariables", local:build-var-array($expr/*:external-variables/*:external-variable))
  ))
  return
    json:array-push($e, $expression)
let $f := json:array()
let $_ :=
  for $frame in $stack/*:frame
  let $uri := $frame/*:uri/fn:data()
  let $is-qconsole :=
    (
      fn:string-length($uri) eq 0 and
      ($stack/*:frame/*:uri = "/MarkLogic/appservices/qconsole/qconsole-amped.xqy")
    )
  return
    json:array-push($f, map:new((
      map:entry("uri", $uri),
      map:entry("type",
        if ($is-qconsole) then
          "xdmp:eval"
        else if ($uri = "/eval") then
          "invoke"
        else
          ""),
      map:entry("location", map:new((
        map:entry("database", $frame/*:location/*:database/fn:data()),
        map:entry("uri", $frame/*:location/*:uri/fn:data())
      ))),
      map:entry("line", $frame/*:line/fn:data()),
      map:entry("column", $frame/*:line/fn:data()),
      map:entry("globalVariables", local:build-var-array($frame/*:global-variables/*:global-variable)),
      map:entry("externalVariables", local:build-var-array($frame/*:external-variables/*:external-variable)),
      map:entry("variables", local:build-var-array($frame/*:variables/*:variable))
    )))
return
  xdmp:to-json(map:new((
    map:entry("expressions", $e),
    map:entry("frames", $f)
  )))
