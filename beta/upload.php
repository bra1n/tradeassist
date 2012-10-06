<?php

$str = file_get_contents("php://input");
file_put_contents("upload.jpg", pack("H*", $str));

?>