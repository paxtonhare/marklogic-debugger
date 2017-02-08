import module namespace admin = "http://marklogic.com/xdmp/admin"
      at "/MarkLogic/admin.xqy";

declare variable $serverId external;
declare variable $uri external;

declare variable  $ml-dir := xdmp:filesystem-filepath('.') || '/Modules';

let $server-id := xs:unsignedLong($serverId)
let $config := admin:get-configuration()
let $modules-db := admin:appserver-get-modules-database($config, $server-id)
let $server-root := admin:appserver-get-root($config, $server-id)
return
  if ($modules-db = 0) then
    if (fn:starts-with($uri, "/MarkLogic/")) then
      xdmp:document-get($ml-dir || $uri)
    else
      xdmp:document-get($server-root || $uri)
  else
    xdmp:invoke-function(function() {
      if (fn:starts-with($uri, "/MarkLogic/")) then
        xdmp:document-get($ml-dir || $uri)
      else
        fn:doc($uri)
    },
    <options xmlns="xdmp:eval">
      <isolation>different-transaction</isolation>
      <database>{$modules-db}</database>
      <transaction-mode>update-auto-commit</transaction-mode>
    </options>)
