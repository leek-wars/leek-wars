<?php

$files = scandirrec('.');

$times = array();
foreach ($files as $file) {
	$times[$file] = filemtime($file);
}

echo json_encode($times);


function scandirrec($dir, $prefix = '') {

	$dir = rtrim($dir, '\\/');
	$result = array();

	foreach (scandir($dir) as $f) {
		if ($f !== '.' and $f !== '..') {

			if ("$dir/$f" === './image/avatar' or "$dir/$f" === './image/emblem') {
				continue; // Pas les avatars et les emblèmes
			}

			if (is_dir("$dir/$f")) {
				$result = array_merge($result, scandirrec("$dir/$f", "$prefix$f/"));
			} else {
				$result[] = $prefix . $f;
			}
		}
	}

	return $result;
}

?>