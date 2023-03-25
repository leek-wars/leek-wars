<template>

	<svg class="tournament" :viewBox="viewBox">

		<g v-if="tournament.size === 64">
			<tournament-block :item="thirtyseconds[0].contestants[0]" :x="-610" :y="-395" :size="40" />
			<tournament-fight :fight="thirtyseconds[0].fight" :x="-570" :y="-390" />
			<tournament-block :item="thirtyseconds[0].contestants[1]" :x="-540" :y="-395" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[1].contestants[0]" :x="-610" :y="-345" :size="40" />
			<tournament-fight :fight="thirtyseconds[1].fight" :x="-570" :y="-340" />
			<tournament-block :item="thirtyseconds[1].contestants[1]" :x="-540" :y="-345" :size="40" :invert="true" />

			<polyline class="line" points="-500 -325, -470 -325" />
			<polyline class="line" points="-500 -375, -445 -375, -445 -350" />

			<tournament-block :item="thirtyseconds[2].contestants[0]" :x="-610" :y="-295" :size="40" />
			<tournament-fight :fight="thirtyseconds[2].fight" :x="-570" :y="-290" />
			<tournament-block :item="thirtyseconds[2].contestants[1]" :x="-540" :y="-295" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[3].contestants[0]" :x="-610" :y="-245" :size="40" />
			<tournament-fight :fight="thirtyseconds[3].fight" :x="-570" :y="-240" />
			<tournament-block :item="thirtyseconds[3].contestants[1]" :x="-540" :y="-245" :size="40" :invert="true" />

			<polyline class="line" points="-500 -270, -470 -270" />
			<polyline class="line" points="-500 -220, -445 -220, -445 -230" />

			<tournament-block :item="thirtyseconds[4].contestants[0]" :x="-610" :y="-195" :size="40" />
			<tournament-fight :fight="thirtyseconds[4].fight" :x="-570" :y="-190" />
			<tournament-block :item="thirtyseconds[4].contestants[1]" :x="-540" :y="-195" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[5].contestants[0]" :x="-610" :y="-145" :size="40" />
			<tournament-fight :fight="thirtyseconds[5].fight" :x="-570" :y="-140" />
			<tournament-block :item="thirtyseconds[5].contestants[1]" :x="-540" :y="-145" :size="40" :invert="true" />

			<polyline class="line" points="-500 -125, -470 -125" />
			<polyline class="line" points="-500 -175, -445 -175, -445 -150" />

			<tournament-block :item="thirtyseconds[6].contestants[0]" :x="-610" :y="-95" :size="40" />
			<tournament-fight :fight="thirtyseconds[6].fight" :x="-570" :y="-90" />
			<tournament-block :item="thirtyseconds[6].contestants[1]" :x="-540" :y="-95" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[7].contestants[0]" :x="-610" :y="-45" :size="40" />
			<tournament-fight :fight="thirtyseconds[7].fight" :x="-570" :y="-40" />
			<tournament-block :item="thirtyseconds[7].contestants[1]" :x="-540" :y="-45" :size="40" :invert="true" />

			<polyline class="line" points="-500 -70, -470 -70" />
			<polyline class="line" points="-500 -20, -445 -20, -445 -30" />

			<tournament-block :item="thirtyseconds[8].contestants[0]" :x="-610" :y="5" :size="40" />
			<tournament-fight :fight="thirtyseconds[8].fight" :x="-570" :y="10" />
			<tournament-block :item="thirtyseconds[8].contestants[1]" :x="-540" :y="5" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[9].contestants[0]" :x="-610" :y="55" :size="40" />
			<tournament-fight :fight="thirtyseconds[9].fight" :x="-570" :y="60" />
			<tournament-block :item="thirtyseconds[9].contestants[1]" :x="-540" :y="55" :size="40" :invert="true" />

			<polyline class="line" points="-500 20, -445 20, -445 50" />
			<polyline class="line" points="-500 70, -470 70" />

			<tournament-block :item="thirtyseconds[10].contestants[0]" :x="-610" :y="105" :size="40" />
			<tournament-fight :fight="thirtyseconds[10].fight" :x="-570" :y="110" />
			<tournament-block :item="thirtyseconds[10].contestants[1]" :x="-540" :y="105" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[11].contestants[0]" :x="-610" :y="155" :size="40" />
			<tournament-fight :fight="thirtyseconds[11].fight" :x="-570" :y="160" />
			<tournament-block :item="thirtyseconds[11].contestants[1]" :x="-540" :y="155" :size="40" :invert="true" />

			<polyline class="line" points="-500 125, -470 125" />
			<polyline class="line" points="-500 175, -445 175, -445 150" />

			<tournament-block :item="thirtyseconds[12].contestants[0]" :x="-610" :y="205" :size="40" />
			<tournament-fight :fight="thirtyseconds[12].fight" :x="-570" :y="210" />
			<tournament-block :item="thirtyseconds[12].contestants[1]" :x="-540" :y="205" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[13].contestants[0]" :x="-610" :y="255" :size="40" />
			<tournament-fight :fight="thirtyseconds[13].fight" :x="-570" :y="260" />
			<tournament-block :item="thirtyseconds[13].contestants[1]" :x="-540" :y="255" :size="40" :invert="true" />

			<polyline class="line" points="-500 270, -470 270" />
			<polyline class="line" points="-500 220, -445 220, -445 250" />

			<tournament-block :item="thirtyseconds[14].contestants[0]" :x="-610" :y="305" :size="40" />
			<tournament-fight :fight="thirtyseconds[14].fight" :x="-570" :y="310" />
			<tournament-block :item="thirtyseconds[14].contestants[1]" :x="-540" :y="305" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[15].contestants[0]" :x="-610" :y="355" :size="40" />
			<tournament-fight :fight="thirtyseconds[15].fight" :x="-570" :y="360" />
			<tournament-block :item="thirtyseconds[15].contestants[1]" :x="-540" :y="355" :size="40" :invert="true" />

			<polyline class="line" points="-500 325, -470 325" />
			<polyline class="line" points="-500 375, -445 375, -445 350" />

			<tournament-block :item="thirtyseconds[16].contestants[0]" :x="500" :y="-395" :size="40" />
			<tournament-fight :fight="thirtyseconds[16].fight" :x="540" :y="-390" />
			<tournament-block :item="thirtyseconds[16].contestants[1]" :x="570" :y="-395" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[17].contestants[0]" :x="500" :y="-345" :size="40" />
			<tournament-fight :fight="thirtyseconds[17].fight" :x="540" :y="-340" />
			<tournament-block :item="thirtyseconds[17].contestants[1]" :x="570" :y="-345" :size="40" :invert="true" />

			<polyline class="line" points="500 -325, 470 -325" />
			<polyline class="line" points="500 -375, 445 -375, 445 -350" />

			<tournament-block :item="thirtyseconds[18].contestants[0]" :x="500" :y="-295" :size="40" />
			<tournament-fight :fight="thirtyseconds[18].fight" :x="540" :y="-290" />
			<tournament-block :item="thirtyseconds[18].contestants[1]" :x="570" :y="-295" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[19].contestants[0]" :x="500" :y="-245" :size="40" />
			<tournament-fight :fight="thirtyseconds[19].fight" :x="540" :y="-240" />
			<tournament-block :item="thirtyseconds[19].contestants[1]" :x="570" :y="-245" :size="40" :invert="true" />

			<polyline class="line" points="500 -270, 470 -270" />
			<polyline class="line" points="500 -220, 445 -220, 445 -230" />

			<tournament-block :item="thirtyseconds[20].contestants[0]" :x="500" :y="-195" :size="40" />
			<tournament-fight :fight="thirtyseconds[20].fight" :x="540" :y="-190" />
			<tournament-block :item="thirtyseconds[20].contestants[1]" :x="570" :y="-195" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[21].contestants[0]" :x="500" :y="-145" :size="40" />
			<tournament-fight :fight="thirtyseconds[21].fight" :x="540" :y="-140" />
			<tournament-block :item="thirtyseconds[21].contestants[1]" :x="570" :y="-145" :size="40" :invert="true" />

			<polyline class="line" points="500 -125, 470 -125" />
			<polyline class="line" points="500 -175, 445 -175, 445 -150" />

			<tournament-block :item="thirtyseconds[22].contestants[0]" :x="500" :y="-95" :size="40" />
			<tournament-fight :fight="thirtyseconds[22].fight" :x="540" :y="-90" />
			<tournament-block :item="thirtyseconds[22].contestants[1]" :x="570" :y="-95" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[23].contestants[0]" :x="500" :y="-45" :size="40" />
			<tournament-fight :fight="thirtyseconds[23].fight" :x="540" :y="-40" />
			<tournament-block :item="thirtyseconds[23].contestants[1]" :x="570" :y="-45" :size="40" :invert="true" />

			<polyline class="line" points="500 -70, 470 -70" />
			<polyline class="line" points="500 -20, 445 -20, 445 -30" />

			<tournament-block :item="thirtyseconds[24].contestants[0]" :x="500" :y="5" :size="40" />
			<tournament-fight :fight="thirtyseconds[24].fight" :x="540" :y="10" />
			<tournament-block :item="thirtyseconds[24].contestants[1]" :x="570" :y="5" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[25].contestants[0]" :x="500" :y="55" :size="40" />
			<tournament-fight :fight="thirtyseconds[25].fight" :x="540" :y="60" />
			<tournament-block :item="thirtyseconds[25].contestants[1]" :x="570" :y="55" :size="40" :invert="true" />

			<polyline class="line" points="500 20, 445 20, 445 50" />
			<polyline class="line" points="500 70, 470 70" />

			<tournament-block :item="thirtyseconds[26].contestants[0]" :x="500" :y="105" :size="40" />
			<tournament-fight :fight="thirtyseconds[26].fight" :x="540" :y="110" />
			<tournament-block :item="thirtyseconds[26].contestants[1]" :x="570" :y="105" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[27].contestants[0]" :x="500" :y="155" :size="40" />
			<tournament-fight :fight="thirtyseconds[27].fight" :x="540" :y="160" />
			<tournament-block :item="thirtyseconds[27].contestants[1]" :x="570" :y="155" :size="40" :invert="true" />

			<polyline class="line" points="500 125, 470 125" />
			<polyline class="line" points="500 175, 445 175, 445 150" />

			<tournament-block :item="thirtyseconds[28].contestants[0]" :x="500" :y="205" :size="40" />
			<tournament-fight :fight="thirtyseconds[28].fight" :x="540" :y="210" />
			<tournament-block :item="thirtyseconds[28].contestants[1]" :x="570" :y="205" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[29].contestants[0]" :x="500" :y="255" :size="40" />
			<tournament-fight :fight="thirtyseconds[29].fight" :x="540" :y="260" />
			<tournament-block :item="thirtyseconds[29].contestants[1]" :x="570" :y="255" :size="40" :invert="true" />

			<polyline class="line" points="500 270, 470 270" />
			<polyline class="line" points="500 220, 445 220, 445 250" />

			<tournament-block :item="thirtyseconds[30].contestants[0]" :x="500" :y="305" :size="40" />
			<tournament-fight :fight="thirtyseconds[30].fight" :x="540" :y="310" />
			<tournament-block :item="thirtyseconds[30].contestants[1]" :x="570" :y="305" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[31].contestants[0]" :x="500" :y="355" :size="40" />
			<tournament-fight :fight="thirtyseconds[31].fight" :x="540" :y="360" />
			<tournament-block :item="thirtyseconds[31].contestants[1]" :x="570" :y="355" :size="40" :invert="true" />

			<polyline class="line" points="500 325, 470 325" />
			<polyline class="line" points="500 375, 445 375, 445 350" />
		</g>

		<tournament-block :item="sixteenths[0].contestants[0]" :x="-470" :y="-350" :size="50" />
		<tournament-fight :fight="sixteenths[0].fight" :x="-420" :y="-340" />
		<tournament-block :item="sixteenths[0].contestants[1]" :x="-390" :y="-350" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[1].contestants[0]" :x="-470" :y="-280" :size="50" />
		<tournament-fight :fight="sixteenths[1].fight" :x="-420" :y="-270" />
		<tournament-block :item="sixteenths[1].contestants[1]" :x="-390" :y="-280" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[2].contestants[0]" :x="-470" :y="-150" :size="50" />
		<tournament-fight :fight="sixteenths[2].fight" :x="-420" :y="-140" />
		<tournament-block :item="sixteenths[2].contestants[1]" :x="-390" :y="-150" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[3].contestants[0]" :x="-470" :y="-80" :size="50" />
		<tournament-fight :fight="sixteenths[3].fight" :x="-420" :y="-70" />
		<tournament-block :item="sixteenths[3].contestants[1]" :x="-390" :y="-80" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[4].contestants[0]" :x="-470" :y="30" :size="50" />
		<tournament-fight :fight="sixteenths[4].fight" :x="-420" :y="40" />
		<tournament-block :item="sixteenths[4].contestants[1]" :x="-390" :y="30" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[5].contestants[0]" :x="-470" :y="100" :size="50" />
		<tournament-fight :fight="sixteenths[5].fight" :x="-420" :y="110" />
		<tournament-block :item="sixteenths[5].contestants[1]" :x="-390" :y="100" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[6].contestants[0]" :x="-470" :y="230" :size="50" />
		<tournament-fight :fight="sixteenths[6].fight" :x="-420" :y="240" />
		<tournament-block :item="sixteenths[6].contestants[1]" :x="-390" :y="230" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[7].contestants[0]" :x="-470" :y="300" :size="50" />
		<tournament-fight :fight="sixteenths[7].fight" :x="-420" :y="310" />
		<tournament-block :item="sixteenths[7].contestants[1]" :x="-390" :y="300" :size="50" :invert="true" />

		<polyline class="line" points="-405 -340, -405 -370, -320 -370, -320 -335, -300 -335" />
		<polyline class="line" points="-405 -240, -405 -210, -320 -210, -320 -245, -300 -245" />
		<polyline class="line" points="-405 -140, -405 -170, -320 -170, -320 -135, -300 -135" />
		<polyline class="line" points="-405 -40, -405 -10, -320 -10, -320 -45, -300 -45" />

		<polyline class="line" points="-405 40, -405 10, -320 10, -320 45, -300 45" />
		<polyline class="line" points="-405 340, -405 370, -320 370, -320 335, -300 335" />
		<polyline class="line" points="-405 240, -405 210, -320 210, -320 245, -300 245" />
		<polyline class="line" points="-405 140, -405 170, -320 170, -320 135, -300 135" />

		<tournament-block :item="eighths[0].contestants[0]" :x="-300" :y="-365" :size="60" />
		<tournament-fight :fight="eighths[0].fight" :x="-285" :y="-305" />
		<tournament-block :item="eighths[0].contestants[1]" :x="-300" :y="-275" :size="60" :invert="true" />

		<tournament-block :item="eighths[1].contestants[0]" :x="-300" :y="-165" :size="60" />
		<tournament-fight :fight="eighths[1].fight" :x="-285" :y="-105" />
		<tournament-block :item="eighths[1].contestants[1]" :x="-300" :y="-75" :size="60" :invert="true" />

		<tournament-block :item="eighths[2].contestants[0]" :x="-300" :y="15" :size="60" />
		<tournament-fight :fight="eighths[2].fight" :x="-285" :y="75" />
		<tournament-block :item="eighths[2].contestants[1]" :x="-300" :y="105" :size="60" :invert="true" />

		<tournament-block :item="eighths[3].contestants[0]" :x="-300" :y="215" :size="60" />
		<tournament-fight :fight="eighths[3].fight"	:x="-285" :y="275" />
		<tournament-block :item="eighths[3].contestants[1]" :x="-300" :y="305" :size="60" :invert="true" />

		<polyline class="line" points="-255 -290, -175 -290, -175 -275" />
		<polyline class="line" points="-255 -90, -175 -90, -175 -105" />
		<polyline class="line" points="-255 290, -175 290, -175 275" />
		<polyline class="line" points="-255 90, -175 90, -175 105" />

		<tournament-block :item="quarters[0].contestants[0]" :x="-210" :y="-275" :size="70" />
		<tournament-fight :fight="quarters[0].fight" :x="-190" :y="-205" />
		<tournament-block :item="quarters[0].contestants[1]" :x="-210" :y="-175" :size="70" :invert="true" />

		<tournament-block :item="quarters[1].contestants[0]" :x="-210" :y="105" :size="70" />
		<tournament-fight :fight="quarters[1].fight" :x="-190" :y="175" />
		<tournament-block :item="quarters[1].contestants[1]" :x="-210" :y="205" :size="70" :invert="true" />

		<polyline class="line" points="-160 -190, -122.2 -190, -122.5 -110, -80 -110, -80, -95" />
		<polyline class="line" points="-160 190, -122.2 190, -122.5 110, -80 110, -80, 95" />

		<tournament-block :item="semifinals[0].contestants[0]" :x="-120" :y="-95" :size="80" />
		<tournament-fight :fight="semifinals[0].fight" :x="-95" :y="-15" />
		<tournament-block :item="semifinals[0].contestants[1]" :x="-120" :y="15" :size="80" :invert="true" />

		<polyline class="line" points="-65 0, -25 0, -25 -145, -60 -145, -60 -165" />

		<tournament-block :item="sixteenths[8].contestants[0]" :x="340" :y="-350" :size="50" />
		<tournament-fight :fight="sixteenths[8].fight" :x="390" :y="-340" />
		<tournament-block :item="sixteenths[8].contestants[1]" :x="420 " :y="-350" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[9].contestants[0]" :x="340" :y="-280" :size="50" />
		<tournament-fight :fight="sixteenths[9].fight" :x="390" :y="-270" />
		<tournament-block :item="sixteenths[9].contestants[1]" :x="420" :y="-280" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[10].contestants[0]" :x="340" :y="-150" :size="50" />
		<tournament-fight :fight="sixteenths[10].fight"	:x="390" :y="-140" />
		<tournament-block :item="sixteenths[10].contestants[1]" :x="420 " :y="-150" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[11].contestants[0]" :x="340" :y="-80" :size="50" />
		<tournament-fight :fight="sixteenths[11].fight"	:x="390" :y="-70" />
		<tournament-block :item="sixteenths[11].contestants[1]" :x="420" :y="-80" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[12].contestants[0]" :x="340" :y="30" :size="50" />
		<tournament-fight :fight="sixteenths[12].fight" :x="390" :y="40" />
		<tournament-block :item="sixteenths[12].contestants[1]" :x="420" :y="30" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[13].contestants[0]" :x="340" :y="100" :size="50" />
		<tournament-fight :fight="sixteenths[13].fight" :x="390" :y="110" />
		<tournament-block :item="sixteenths[13].contestants[1]" :x="420" :y="100" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[14].contestants[0]" :x="340" :y="230" :size="50" />
		<tournament-fight :fight="sixteenths[14].fight"	:x="390" :y="240" />
		<tournament-block :item="sixteenths[14].contestants[1]" :x="420" :y="230" :size="50" :invert="true" />

		<tournament-block :item="sixteenths[15].contestants[0]" :x="340" :y="300" :size="50" />
		<tournament-fight :fight="sixteenths[15].fight" :x="390" :y="310" />
		<tournament-block :item="sixteenths[15].contestants[1]" :x="420" :y="300" :size="50" :invert="true" />

		<polyline class="line" points="405 -340, 405 -370, 320 -370, 320 -335, 300 -335" />
		<polyline class="line" points="405 -240, 405 -210, 320 -210, 320 -245, 300 -245" />
		<polyline class="line" points="405 -140, 405 -170, 320 -170, 320 -135, 300 -135" />
		<polyline class="line" points="405 -40, 405 -10, 320 -10, 320 -45, 300 -45" />

		<polyline class="line" points="405 40, 405 10, 320 10, 320 45, 300 45" />
		<polyline class="line" points="405 340, 405 370, 320 370, 320 335, 300 335" />
		<polyline class="line" points="405 240, 405 210, 320 210, 320 245, 300 245" />
		<polyline class="line" points="405 140, 405 170, 320 170, 320 135, 300 135" />

		<tournament-block :item="eighths[4].contestants[0]" :x="240" :y="-365" :size="60" />
		<tournament-fight :fight="eighths[4].fight"	:x="255" :y="-305" />
		<tournament-block :item="eighths[4].contestants[1]" :x="240" :y="-275" :size="60" :invert="true" />

		<tournament-block :item="eighths[5].contestants[0]" :x="240" :y="-165" :size="60" />
		<tournament-fight :fight="eighths[5].fight" :x="255" :y="-105" />
		<tournament-block :item="eighths[5].contestants[1]" :x="240" :y="-75" :size="60" :invert="true" />

		<tournament-block :item="eighths[6].contestants[0]" :x="240" :y="15" :size="60" />
		<tournament-fight :fight="eighths[6].fight"	:x="255" :y="75" />
		<tournament-block :item="eighths[6].contestants[1]" :x="240" :y="105" :size="60" :invert="true" />

		<tournament-block :item="eighths[7].contestants[0]" :x="240" :y="215" :size="60" />
		<tournament-fight :fight="eighths[7].fight"	:x="255" :y="275" />
		<tournament-block :item="eighths[7].contestants[1]" :x="240" :y="305" :size="60" :invert="true" />

		<polyline class="line" points="255 -290, 175 -290, 175 -275" />
		<polyline class="line" points="255 -90, 175 -90, 175 -105" />
		<polyline class="line" points="255 290, 175 290, 175 275" />
		<polyline class="line" points="255 90, 175 90, 175 105" />

		<tournament-block :item="quarters[2].contestants[0]" :x="140" :y="-275" :size="70" />
		<tournament-fight :fight="quarters[2].fight" :x="160" :y="-205"	/>
		<tournament-block :item="quarters[2].contestants[1]" :x="140" :y="-175" :size="70" :invert="true" />

		<tournament-block :item="quarters[3].contestants[0]" :x="140" :y="105" :size="70" />
		<tournament-fight :fight="quarters[3].fight" :x="160" :y="175" />
		<tournament-block :item="quarters[3].contestants[1]" :x="140" :y="205" :size="70" :invert="true" />

		<polyline class="line" points="160 -190, 122.2 -190, 122.5 -110, 80 -110, 80, -95" />
		<polyline class="line" points="160 190, 122.2 190, 122.5 110, 80 110, 80, 95" />

		<tournament-block :item="semifinals[1].contestants[0]" :x="40" :y="-95" :size="80" />
		<tournament-fight :fight="semifinals[1].fight" :x="65" :y="-15" />
		<tournament-block :item="semifinals[1].contestants[1]" :x="40" :y="15" :size="80" :invert="true" />

		<polyline class="line" points="65 0, 25 0, 25 -145, 60 -145, 60 -165" />

		<tournament-block :item="finals[0].contestants[0]" :x="-105" :y="-250" :size="90" />
		<tournament-fight :fight="finals[0].fight" :x="-15" :y="-220" />
		<tournament-block :item="finals[0].contestants[1]" :x="15" :y="-250" :size="90" :invert="true" />

		<polyline class="line" points="0 -220, 0 -295" />

		<tournament-block :item="tournament.winner.name ? tournament.winner : null" :x="-60" :y="-395" :size="120" />
	</svg>
</template>

<script lang="ts">
	import TournamentBlock from '@/component/tournament/tournament-block.vue'
	import TournamentFight from '@/component/tournament/tournament-fight.vue'
	import { Tournament } from '@/model/tournament'
	import { Component, Prop, Vue } from 'vue-property-decorator'

	@Component({ name: 'tournament-graph', components: {
		'tournament-block': TournamentBlock,
		'tournament-fight': TournamentFight
	} })
	export default class TournamentGraph extends Vue {
		@Prop({ required: true }) tournament!: Tournament

		get viewBox() {
			return this.tournament.size === 64 ? "-612 -400 1224 800" : "-472 -400 944 800"
		}

		get thirtyseconds() { return this.tournament.rounds.thirtyseconds }
		get sixteenths() { return this.tournament.rounds.sixteenths }
		get eighths() { return this.tournament.rounds.eighths }
		get quarters() { return this.tournament.rounds.quarters }
		get semifinals() { return this.tournament.rounds.semifinals }
		get finals() { return this.tournament.rounds.finals }
	}
</script>

<style lang="scss" scoped>
.tooltip {
	transform: translate(-50%, 0px);
	opacity: 0.9;
	z-index: 10;
}
.tournament.zoomed {
	overflow-x: auto;
}
#app.app .tournament.zoomed {
	width: auto;
}
.line {
	stroke: #aaa;
	stroke-width: 3;
	fill: none;
}
</style>
