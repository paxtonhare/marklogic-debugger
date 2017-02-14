import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

declare variable $uri external;

declare variable $serverId external;

declare variable  $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';

let $server-id := xs:unsignedLong($serverId)
let $config := admin:get-configuration()
let $modules-db := admin:appserver-get-modules-database($config, $server-id)
let $content-db := admin:appserver-get-database($config, $server-id)
let $server-root := admin:appserver-get-root($config, $server-id)
let $options :=
  <options xmlns="xdmp:eval">
    <database>{$content-db}</database>
    <modules>{$modules-db}</modules>
  </options>
return
  if (fn:starts-with($uri, "/MarkLogic/")) then
    dbg:invoke($uri, (), $options)
  else
    dbg:invoke($uri, (), $options)
