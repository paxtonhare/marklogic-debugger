declare variable $requestId external;
declare variable $uri external;
declare variable $line external;

let $expr-id :=
  let $requestId := xs:unsignedLong($requestId)
  let $line := xs:unsignedInt($line) + 1
  let $expressions := dbg:line($requestId, $uri, $line) ! dbg:expr($requestId, .)
  return
    (($expressions[dbg:line = $line])[1], $expressions[1])[1]/dbg:expr-id/fn:data()
return
  dbg:break(xs:unsignedLong($requestId), $expr-id)
