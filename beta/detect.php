<?php
/**
 * Created by JetBrains PhpStorm.
 * User: brain
 * Date: 13.03.11
 * Time: 21:09
 * To change this template use File | Settings | File Templates.
 */
$input = imagecreatefromjpeg("upload.jpg");
$width = imagesx($input);
$height = imagesy($input);
$pixels = array();

for($y = 0;$y<$height;$y++) {
    for($x = 0;$x<$width;$x++) {
        $pixels[$x][$y] = imagecolorsforindex($input,imagecolorat($input,$x,$y));
    }
}
$pixels = threshold($pixels,0.10);

$output = imagecreatetruecolor($width,$height);
imagefill($output,0,0,imagecolorallocate($output,0,255,0));
foreach($pixels as $x=>$column) {
    foreach($column as $y=>$color) {
        imagesetpixel($output,$x,$y,imagecolorallocate($output,$color['red'],$color['green'],$color['blue']));
    }
}
/* Output image to browser */
header("Content-type: image/png");
imagePng($output);

function threshold($pixels,$percent) {
	$colors = array();
	foreach($pixels as $column) {
		foreach($column as $color) {
			$colors[] = $color['red']+$color['green']+$color['blue'];
		}
	}

	$colors = array_unique($colors);
	sort($colors);
	$min = $colors[0];
	$max = $colors[count($colors)-1];
	$range = $max - $min;
	$colors = array_flip($colors);

	foreach($pixels as $x=>$column) {
		foreach($column as $y=>$color) {
			if($colors[$color['red']+$color['green']+$color['blue']]>$min+$range*$percent
			&& $colors[$color['red']+$color['green']+$color['blue']]<$max-$range*$percent) {
				unset($pixels[$x][$y]);
			}
		}
	}

	return $pixels;
}

// Bild an der längeren Seite halbieren
function splitImage($pixels) {}

// Durchschnittswerte für jede Farbe eines Pixelarrays berechnen
function calculateAverages($pixels) {}

// Differenz von 2 Durchschnittswerten (logarithmisch?) hashen in ein Zeichen
function hashDifference($avg1,$avg2) {}