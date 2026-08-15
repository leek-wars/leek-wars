<template>

	<svg ref="svg" class="tournament" :viewBox="viewBox" :style="{ height: height ? height + 'px' : undefined }">

		<g v-if="tournament.size === 64">
			<tournament-block :item="thirtyseconds[0].contestants[0]" :x="sx(-610)" :y="-395" :size="40" />
			<tournament-fight :fight="thirtyseconds[0].fight" :x="sx(-570)" :y="-390" />
			<tournament-block :item="thirtyseconds[0].contestants[1]" :x="sx(-540)" :y="-395" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[1].contestants[0]" :x="sx(-610)" :y="-345" :size="40" />
			<tournament-fight :fight="thirtyseconds[1].fight" :x="sx(-570)" :y="-340" />
			<tournament-block :item="thirtyseconds[1].contestants[1]" :x="sx(-540)" :y="-345" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 1)" :points="L('-500 -325, -470 -325')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 0)" :points="L('-500 -375, -445 -375, -445 -350')" />

			<tournament-block :item="thirtyseconds[2].contestants[0]" :x="sx(-610)" :y="-295" :size="40" />
			<tournament-fight :fight="thirtyseconds[2].fight" :x="sx(-570)" :y="-290" />
			<tournament-block :item="thirtyseconds[2].contestants[1]" :x="sx(-540)" :y="-295" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[3].contestants[0]" :x="sx(-610)" :y="-245" :size="40" />
			<tournament-fight :fight="thirtyseconds[3].fight" :x="sx(-570)" :y="-240" />
			<tournament-block :item="thirtyseconds[3].contestants[1]" :x="sx(-540)" :y="-245" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 2)" :points="L('-500 -270, -470 -270')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 3)" :points="L('-500 -220, -445 -220, -445 -230')" />

			<tournament-block :item="thirtyseconds[4].contestants[0]" :x="sx(-610)" :y="-195" :size="40" />
			<tournament-fight :fight="thirtyseconds[4].fight" :x="sx(-570)" :y="-190" />
			<tournament-block :item="thirtyseconds[4].contestants[1]" :x="sx(-540)" :y="-195" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[5].contestants[0]" :x="sx(-610)" :y="-145" :size="40" />
			<tournament-fight :fight="thirtyseconds[5].fight" :x="sx(-570)" :y="-140" />
			<tournament-block :item="thirtyseconds[5].contestants[1]" :x="sx(-540)" :y="-145" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 5)" :points="L('-500 -125, -470 -125')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 4)" :points="L('-500 -175, -445 -175, -445 -150')" />

			<tournament-block :item="thirtyseconds[6].contestants[0]" :x="sx(-610)" :y="-95" :size="40" />
			<tournament-fight :fight="thirtyseconds[6].fight" :x="sx(-570)" :y="-90" />
			<tournament-block :item="thirtyseconds[6].contestants[1]" :x="sx(-540)" :y="-95" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[7].contestants[0]" :x="sx(-610)" :y="-45" :size="40" />
			<tournament-fight :fight="thirtyseconds[7].fight" :x="sx(-570)" :y="-40" />
			<tournament-block :item="thirtyseconds[7].contestants[1]" :x="sx(-540)" :y="-45" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 6)" :points="L('-500 -70, -470 -70')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 7)" :points="L('-500 -20, -445 -20, -445 -30')" />

			<tournament-block :item="thirtyseconds[8].contestants[0]" :x="sx(-610)" :y="5" :size="40" />
			<tournament-fight :fight="thirtyseconds[8].fight" :x="sx(-570)" :y="10" />
			<tournament-block :item="thirtyseconds[8].contestants[1]" :x="sx(-540)" :y="5" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[9].contestants[0]" :x="sx(-610)" :y="55" :size="40" />
			<tournament-fight :fight="thirtyseconds[9].fight" :x="sx(-570)" :y="60" />
			<tournament-block :item="thirtyseconds[9].contestants[1]" :x="sx(-540)" :y="55" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 8)" :points="L('-500 20, -445 20, -445 50')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 9)" :points="L('-500 70, -470 70')" />

			<tournament-block :item="thirtyseconds[10].contestants[0]" :x="sx(-610)" :y="105" :size="40" />
			<tournament-fight :fight="thirtyseconds[10].fight" :x="sx(-570)" :y="110" />
			<tournament-block :item="thirtyseconds[10].contestants[1]" :x="sx(-540)" :y="105" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[11].contestants[0]" :x="sx(-610)" :y="155" :size="40" />
			<tournament-fight :fight="thirtyseconds[11].fight" :x="sx(-570)" :y="160" />
			<tournament-block :item="thirtyseconds[11].contestants[1]" :x="sx(-540)" :y="155" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 10)" :points="L('-500 125, -470 125')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 11)" :points="L('-500 175, -445 175, -445 150')" />

			<tournament-block :item="thirtyseconds[12].contestants[0]" :x="sx(-610)" :y="205" :size="40" />
			<tournament-fight :fight="thirtyseconds[12].fight" :x="sx(-570)" :y="210" />
			<tournament-block :item="thirtyseconds[12].contestants[1]" :x="sx(-540)" :y="205" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[13].contestants[0]" :x="sx(-610)" :y="255" :size="40" />
			<tournament-fight :fight="thirtyseconds[13].fight" :x="sx(-570)" :y="260" />
			<tournament-block :item="thirtyseconds[13].contestants[1]" :x="sx(-540)" :y="255" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 13)" :points="L('-500 270, -470 270')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 12)" :points="L('-500 220, -445 220, -445 250')" />

			<tournament-block :item="thirtyseconds[14].contestants[0]" :x="sx(-610)" :y="305" :size="40" />
			<tournament-fight :fight="thirtyseconds[14].fight" :x="sx(-570)" :y="310" />
			<tournament-block :item="thirtyseconds[14].contestants[1]" :x="sx(-540)" :y="305" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[15].contestants[0]" :x="sx(-610)" :y="355" :size="40" />
			<tournament-fight :fight="thirtyseconds[15].fight" :x="sx(-570)" :y="360" />
			<tournament-block :item="thirtyseconds[15].contestants[1]" :x="sx(-540)" :y="355" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 14)" :points="L('-500 325, -470 325')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 15)" :points="L('-500 375, -445 375, -445 350')" />

			<tournament-block :item="thirtyseconds[16].contestants[0]" :x="sx(500)" :y="-395" :size="40" />
			<tournament-fight :fight="thirtyseconds[16].fight" :x="sx(540)" :y="-390" />
			<tournament-block :item="thirtyseconds[16].contestants[1]" :x="sx(570)" :y="-395" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[17].contestants[0]" :x="sx(500)" :y="-345" :size="40" />
			<tournament-fight :fight="thirtyseconds[17].fight" :x="sx(540)" :y="-340" />
			<tournament-block :item="thirtyseconds[17].contestants[1]" :x="sx(570)" :y="-345" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 17)" :points="L('500 -325, 470 -325')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 16)" :points="L('500 -375, 445 -375, 445 -350')" />

			<tournament-block :item="thirtyseconds[18].contestants[0]" :x="sx(500)" :y="-295" :size="40" />
			<tournament-fight :fight="thirtyseconds[18].fight" :x="sx(540)" :y="-290" />
			<tournament-block :item="thirtyseconds[18].contestants[1]" :x="sx(570)" :y="-295" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[19].contestants[0]" :x="sx(500)" :y="-245" :size="40" />
			<tournament-fight :fight="thirtyseconds[19].fight" :x="sx(540)" :y="-240" />
			<tournament-block :item="thirtyseconds[19].contestants[1]" :x="sx(570)" :y="-245" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 18)" :points="L('500 -270, 470 -270')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 19)" :points="L('500 -220, 445 -220, 445 -230')" />

			<tournament-block :item="thirtyseconds[20].contestants[0]" :x="sx(500)" :y="-195" :size="40" />
			<tournament-fight :fight="thirtyseconds[20].fight" :x="sx(540)" :y="-190" />
			<tournament-block :item="thirtyseconds[20].contestants[1]" :x="sx(570)" :y="-195" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[21].contestants[0]" :x="sx(500)" :y="-145" :size="40" />
			<tournament-fight :fight="thirtyseconds[21].fight" :x="sx(540)" :y="-140" />
			<tournament-block :item="thirtyseconds[21].contestants[1]" :x="sx(570)" :y="-145" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 21)" :points="L('500 -125, 470 -125')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 20)" :points="L('500 -175, 445 -175, 445 -150')" />

			<tournament-block :item="thirtyseconds[22].contestants[0]" :x="sx(500)" :y="-95" :size="40" />
			<tournament-fight :fight="thirtyseconds[22].fight" :x="sx(540)" :y="-90" />
			<tournament-block :item="thirtyseconds[22].contestants[1]" :x="sx(570)" :y="-95" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[23].contestants[0]" :x="sx(500)" :y="-45" :size="40" />
			<tournament-fight :fight="thirtyseconds[23].fight" :x="sx(540)" :y="-40" />
			<tournament-block :item="thirtyseconds[23].contestants[1]" :x="sx(570)" :y="-45" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 22)" :points="L('500 -70, 470 -70')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 23)" :points="L('500 -20, 445 -20, 445 -30')" />

			<tournament-block :item="thirtyseconds[24].contestants[0]" :x="sx(500)" :y="5" :size="40" />
			<tournament-fight :fight="thirtyseconds[24].fight" :x="sx(540)" :y="10" />
			<tournament-block :item="thirtyseconds[24].contestants[1]" :x="sx(570)" :y="5" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[25].contestants[0]" :x="sx(500)" :y="55" :size="40" />
			<tournament-fight :fight="thirtyseconds[25].fight" :x="sx(540)" :y="60" />
			<tournament-block :item="thirtyseconds[25].contestants[1]" :x="sx(570)" :y="55" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 24)" :points="L('500 20, 445 20, 445 50')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 25)" :points="L('500 70, 470 70')" />

			<tournament-block :item="thirtyseconds[26].contestants[0]" :x="sx(500)" :y="105" :size="40" />
			<tournament-fight :fight="thirtyseconds[26].fight" :x="sx(540)" :y="110" />
			<tournament-block :item="thirtyseconds[26].contestants[1]" :x="sx(570)" :y="105" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[27].contestants[0]" :x="sx(500)" :y="155" :size="40" />
			<tournament-fight :fight="thirtyseconds[27].fight" :x="sx(540)" :y="160" />
			<tournament-block :item="thirtyseconds[27].contestants[1]" :x="sx(570)" :y="155" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 26)" :points="L('500 125, 470 125')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 27)" :points="L('500 175, 445 175, 445 150')" />

			<tournament-block :item="thirtyseconds[28].contestants[0]" :x="sx(500)" :y="205" :size="40" />
			<tournament-fight :fight="thirtyseconds[28].fight" :x="sx(540)" :y="210" />
			<tournament-block :item="thirtyseconds[28].contestants[1]" :x="sx(570)" :y="205" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[29].contestants[0]" :x="sx(500)" :y="255" :size="40" />
			<tournament-fight :fight="thirtyseconds[29].fight" :x="sx(540)" :y="260" />
			<tournament-block :item="thirtyseconds[29].contestants[1]" :x="sx(570)" :y="255" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 29)" :points="L('500 270, 470 270')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 28)" :points="L('500 220, 445 220, 445 250')" />

			<tournament-block :item="thirtyseconds[30].contestants[0]" :x="sx(500)" :y="305" :size="40" />
			<tournament-fight :fight="thirtyseconds[30].fight" :x="sx(540)" :y="310" />
			<tournament-block :item="thirtyseconds[30].contestants[1]" :x="sx(570)" :y="305" :size="40" :invert="true" />

			<tournament-block :item="thirtyseconds[31].contestants[0]" :x="sx(500)" :y="355" :size="40" />
			<tournament-fight :fight="thirtyseconds[31].fight" :x="sx(540)" :y="360" />
			<tournament-block :item="thirtyseconds[31].contestants[1]" :x="sx(570)" :y="355" :size="40" :invert="true" />

			<polyline class="line" :class="lineClass('thirtyseconds', 30)" :points="L('500 325, 470 325')" />
			<polyline class="line" :class="lineClass('thirtyseconds', 31)" :points="L('500 375, 445 375, 445 350')" />
		</g>

		<tournament-fight :fight="sixteenths[0].fight" :x="sx(-420)" :y="-340" />
		<tournament-block :item="sixteenths[0].contestants[0]" :x="sx(-470)" :y="-350" :size="50" />
		<tournament-block :item="sixteenths[0].contestants[1]" :x="sx(-390)" :y="-350" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[1].fight" :x="sx(-420)" :y="-270" />
		<tournament-block :item="sixteenths[1].contestants[0]" :x="sx(-470)" :y="-280" :size="50" />
		<tournament-block :item="sixteenths[1].contestants[1]" :x="sx(-390)" :y="-280" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[2].fight" :x="sx(-420)" :y="-140" />
		<tournament-block :item="sixteenths[2].contestants[0]" :x="sx(-470)" :y="-150" :size="50" />
		<tournament-block :item="sixteenths[2].contestants[1]" :x="sx(-390)" :y="-150" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[3].fight" :x="sx(-420)" :y="-70" />
		<tournament-block :item="sixteenths[3].contestants[0]" :x="sx(-470)" :y="-80" :size="50" />
		<tournament-block :item="sixteenths[3].contestants[1]" :x="sx(-390)" :y="-80" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[4].fight" :x="sx(-420)" :y="40" />
		<tournament-block :item="sixteenths[4].contestants[0]" :x="sx(-470)" :y="30" :size="50" />
		<tournament-block :item="sixteenths[4].contestants[1]" :x="sx(-390)" :y="30" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[5].fight" :x="sx(-420)" :y="110" />
		<tournament-block :item="sixteenths[5].contestants[0]" :x="sx(-470)" :y="100" :size="50" />
		<tournament-block :item="sixteenths[5].contestants[1]" :x="sx(-390)" :y="100" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[6].fight" :x="sx(-420)" :y="240" />
		<tournament-block :item="sixteenths[6].contestants[0]" :x="sx(-470)" :y="230" :size="50" />
		<tournament-block :item="sixteenths[6].contestants[1]" :x="sx(-390)" :y="230" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[7].fight" :x="sx(-420)" :y="310" />
		<tournament-block :item="sixteenths[7].contestants[0]" :x="sx(-470)" :y="300" :size="50" />
		<tournament-block :item="sixteenths[7].contestants[1]" :x="sx(-390)" :y="300" :size="50" :invert="true" />

		<polyline class="line" :class="lineClass('sixteenths', 0)" :points="L('-405 -340, -405 -370, -320 -370, -320 -335, -300 -335')" />
		<polyline class="line" :class="lineClass('sixteenths', 1)" :points="L('-405 -240, -405 -210, -320 -210, -320 -245, -300 -245')" />
		<polyline class="line" :class="lineClass('sixteenths', 2)" :points="L('-405 -140, -405 -170, -320 -170, -320 -135, -300 -135')" />
		<polyline class="line" :class="lineClass('sixteenths', 3)" :points="L('-405 -40, -405 -10, -320 -10, -320 -45, -300 -45')" />

		<polyline class="line" :class="lineClass('sixteenths', 4)" :points="L('-405 40, -405 10, -320 10, -320 45, -300 45')" />
		<polyline class="line" :class="lineClass('sixteenths', 7)" :points="L('-405 340, -405 370, -320 370, -320 335, -300 335')" />
		<polyline class="line" :class="lineClass('sixteenths', 6)" :points="L('-405 240, -405 210, -320 210, -320 245, -300 245')" />
		<polyline class="line" :class="lineClass('sixteenths', 5)" :points="L('-405 140, -405 170, -320 170, -320 135, -300 135')" />

		<tournament-fight :fight="eighths[0].fight" :x="sx(-285)" :y="-305" />
		<tournament-block :item="eighths[0].contestants[0]" :x="sx(-300)" :y="-365" :size="60" :name-above="true" />
		<tournament-block :item="eighths[0].contestants[1]" :x="sx(-300)" :y="-275" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[1].fight" :x="sx(-285)" :y="-105" />
		<tournament-block :item="eighths[1].contestants[0]" :x="sx(-300)" :y="-165" :size="60" :name-above="true" />
		<tournament-block :item="eighths[1].contestants[1]" :x="sx(-300)" :y="-75" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[2].fight" :x="sx(-285)" :y="75" />
		<tournament-block :item="eighths[2].contestants[0]" :x="sx(-300)" :y="15" :size="60" :name-above="true" />
		<tournament-block :item="eighths[2].contestants[1]" :x="sx(-300)" :y="105" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[3].fight"	:x="sx(-285)" :y="275" />
		<tournament-block :item="eighths[3].contestants[0]" :x="sx(-300)" :y="215" :size="60" :name-above="true" />
		<tournament-block :item="eighths[3].contestants[1]" :x="sx(-300)" :y="305" :size="60" :invert="true" />

		<polyline class="line" :class="lineClass('eighths', 0)" :points="L('-255 -290, -235 -290, -235 -300, -175 -300, -175 -275')" />
		<polyline class="line" :class="lineClass('eighths', 1)" :points="L('-255 -90, -235 -90, -235 -80, -175 -80, -175 -105')" />
		<polyline class="line" :class="lineClass('eighths', 3)" :points="L('-255 290, -235 290, -235 300, -175 300, -175 275')" />
		<polyline class="line" :class="lineClass('eighths', 2)" :points="L('-255 90, -235 90, -235 80, -175 80, -175 105')" />

		<tournament-fight :fight="quarters[0].fight" :x="sx(-190)" :y="-205" />
		<tournament-block :item="quarters[0].contestants[0]" :x="sx(-210)" :y="-275" :size="70" :name-above="true" />
		<tournament-block :item="quarters[0].contestants[1]" :x="sx(-210)" :y="-175" :size="70" :invert="true" />

		<tournament-fight :fight="quarters[1].fight" :x="sx(-190)" :y="175" />
		<tournament-block :item="quarters[1].contestants[0]" :x="sx(-210)" :y="105" :size="70" :name-above="true" />
		<tournament-block :item="quarters[1].contestants[1]" :x="sx(-210)" :y="205" :size="70" :invert="true" />

		<polyline class="line" :class="lineClass('quarters', 0)" :points="L('-160 -190, -122.2 -190, -122.5 -120, -80 -120, -80, -95')" />
		<polyline class="line" :class="lineClass('quarters', 1)" :points="L('-160 190, -122.2 190, -122.5 120, -80 120, -80, 95')" />

		<tournament-fight :fight="semifinals[0].fight" :x="sx(-95)" :y="-15" />
		<tournament-block :item="semifinals[0].contestants[0]" :x="sx(-120)" :y="-95" :size="80" :name-above="true" />
		<tournament-block :item="semifinals[0].contestants[1]" :x="sx(-120)" :y="15" :size="80" :invert="true" />

		<polyline class="line" :class="lineClass('semifinals', 0)" :points="L('-65 0, -25 0, -25 -135, -60 -135, -60 -165', 1)" />

		<tournament-fight :fight="sixteenths[8].fight" :x="sx(390)" :y="-340" />
		<tournament-block :item="sixteenths[8].contestants[0]" :x="sx(340)" :y="-350" :size="50" />
		<tournament-block :item="sixteenths[8].contestants[1]" :x="sx(420)" :y="-350" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[9].fight" :x="sx(390)" :y="-270" />
		<tournament-block :item="sixteenths[9].contestants[0]" :x="sx(340)" :y="-280" :size="50" />
		<tournament-block :item="sixteenths[9].contestants[1]" :x="sx(420)" :y="-280" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[10].fight"	:x="sx(390)" :y="-140" />
		<tournament-block :item="sixteenths[10].contestants[0]" :x="sx(340)" :y="-150" :size="50" />
		<tournament-block :item="sixteenths[10].contestants[1]" :x="sx(420)" :y="-150" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[11].fight"	:x="sx(390)" :y="-70" />
		<tournament-block :item="sixteenths[11].contestants[0]" :x="sx(340)" :y="-80" :size="50" />
		<tournament-block :item="sixteenths[11].contestants[1]" :x="sx(420)" :y="-80" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[12].fight" :x="sx(390)" :y="40" />
		<tournament-block :item="sixteenths[12].contestants[0]" :x="sx(340)" :y="30" :size="50" />
		<tournament-block :item="sixteenths[12].contestants[1]" :x="sx(420)" :y="30" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[13].fight" :x="sx(390)" :y="110" />
		<tournament-block :item="sixteenths[13].contestants[0]" :x="sx(340)" :y="100" :size="50" />
		<tournament-block :item="sixteenths[13].contestants[1]" :x="sx(420)" :y="100" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[14].fight"	:x="sx(390)" :y="240" />
		<tournament-block :item="sixteenths[14].contestants[0]" :x="sx(340)" :y="230" :size="50" />
		<tournament-block :item="sixteenths[14].contestants[1]" :x="sx(420)" :y="230" :size="50" :invert="true" />

		<tournament-fight :fight="sixteenths[15].fight" :x="sx(390)" :y="310" />
		<tournament-block :item="sixteenths[15].contestants[0]" :x="sx(340)" :y="300" :size="50" />
		<tournament-block :item="sixteenths[15].contestants[1]" :x="sx(420)" :y="300" :size="50" :invert="true" />

		<polyline class="line" :class="lineClass('sixteenths', 8)" :points="L('405 -340, 405 -370, 320 -370, 320 -335, 300 -335')" />
		<polyline class="line" :class="lineClass('sixteenths', 9)" :points="L('405 -240, 405 -210, 320 -210, 320 -245, 300 -245')" />
		<polyline class="line" :class="lineClass('sixteenths', 10)" :points="L('405 -140, 405 -170, 320 -170, 320 -135, 300 -135')" />
		<polyline class="line" :class="lineClass('sixteenths', 11)" :points="L('405 -40, 405 -10, 320 -10, 320 -45, 300 -45')" />

		<polyline class="line" :class="lineClass('sixteenths', 12)" :points="L('405 40, 405 10, 320 10, 320 45, 300 45')" />
		<polyline class="line" :class="lineClass('sixteenths', 15)" :points="L('405 340, 405 370, 320 370, 320 335, 300 335')" />
		<polyline class="line" :class="lineClass('sixteenths', 14)" :points="L('405 240, 405 210, 320 210, 320 245, 300 245')" />
		<polyline class="line" :class="lineClass('sixteenths', 13)" :points="L('405 140, 405 170, 320 170, 320 135, 300 135')" />

		<tournament-fight :fight="eighths[4].fight"	:x="sx(255)" :y="-305" />
		<tournament-block :item="eighths[4].contestants[0]" :x="sx(240)" :y="-365" :size="60" :name-above="true" />
		<tournament-block :item="eighths[4].contestants[1]" :x="sx(240)" :y="-275" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[5].fight" :x="sx(255)" :y="-105" />
		<tournament-block :item="eighths[5].contestants[0]" :x="sx(240)" :y="-165" :size="60" :name-above="true" />
		<tournament-block :item="eighths[5].contestants[1]" :x="sx(240)" :y="-75" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[6].fight"	:x="sx(255)" :y="75" />
		<tournament-block :item="eighths[6].contestants[0]" :x="sx(240)" :y="15" :size="60" :name-above="true" />
		<tournament-block :item="eighths[6].contestants[1]" :x="sx(240)" :y="105" :size="60" :invert="true" />

		<tournament-fight :fight="eighths[7].fight"	:x="sx(255)" :y="275" />
		<tournament-block :item="eighths[7].contestants[0]" :x="sx(240)" :y="215" :size="60" :name-above="true" />
		<tournament-block :item="eighths[7].contestants[1]" :x="sx(240)" :y="305" :size="60" :invert="true" />

		<polyline class="line" :class="lineClass('eighths', 4)" :points="L('255 -290, 235 -290, 235 -300, 175 -300, 175 -275')" />
		<polyline class="line" :class="lineClass('eighths', 5)" :points="L('255 -90, 235 -90, 235 -80, 175 -80, 175 -105')" />
		<polyline class="line" :class="lineClass('eighths', 7)" :points="L('255 290, 235 290, 235 300, 175 300, 175 275')" />
		<polyline class="line" :class="lineClass('eighths', 6)" :points="L('255 90, 235 90, 235 80, 175 80, 175 105')" />

		<tournament-fight :fight="quarters[2].fight" :x="sx(160)" :y="-205"	/>
		<tournament-block :item="quarters[2].contestants[0]" :x="sx(140)" :y="-275" :size="70" :name-above="true" />
		<tournament-block :item="quarters[2].contestants[1]" :x="sx(140)" :y="-175" :size="70" :invert="true" />

		<tournament-fight :fight="quarters[3].fight" :x="sx(160)" :y="175" />
		<tournament-block :item="quarters[3].contestants[0]" :x="sx(140)" :y="105" :size="70" :name-above="true" />
		<tournament-block :item="quarters[3].contestants[1]" :x="sx(140)" :y="205" :size="70" :invert="true" />

		<polyline class="line" :class="lineClass('quarters', 2)" :points="L('160 -190, 122.2 -190, 122.5 -120, 80 -120, 80, -95')" />
		<polyline class="line" :class="lineClass('quarters', 3)" :points="L('160 190, 122.2 190, 122.5 120, 80 120, 80, 95')" />

		<tournament-fight :fight="semifinals[1].fight" :x="sx(65)" :y="-15" />
		<tournament-block :item="semifinals[1].contestants[0]" :x="sx(40)" :y="-95" :size="80" :name-above="true" />
		<tournament-block :item="semifinals[1].contestants[1]" :x="sx(40)" :y="15" :size="80" :invert="true" />

		<polyline class="line" :class="lineClass('semifinals', 1)" :points="L('65 0, 25 0, 25 -135, 60 -135, 60 -165', 1)" />

		<!-- Sommet du bracket : positions brutes, sans sx(), pour rester centré. -->
		<tournament-fight :fight="finals[0].fight" :x="-15" :y="-220" />
		<tournament-block :item="finals[0].contestants[0]" :x="-105" :y="-250" :size="90" />
		<tournament-block :item="finals[0].contestants[1]" :x="15" :y="-250" :size="90" :invert="true" />

		<polyline class="line" :class="lineClass('finals', 0)" points="0 -220, 0 -295" />

		<image :x="-117" :y="-385" :height="89" xlink:href="/image/laurel.png" :class="{grey: !champion}" />
		<tournament-block :item="champion" :x="-60" :y="-395" :size="120" />
	</svg>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, useTemplateRef, watch, provide } from 'vue'
import TournamentBlock from '@/component/tournament/tournament-block.vue'
import TournamentFight from '@/component/tournament/tournament-fight.vue'
import type { Tournament, TournamentEntry } from '@/model/tournament'
import { CHAMPION, sameEntry } from '@/component/tournament/bracket'

defineOptions({ name: 'TournamentGraph', components: {
	'tournament-block': TournamentBlock,
	'tournament-fight': TournamentFight
} })

const props = defineProps<{
	tournament: Tournament
	/** Mode zoom : le graphe reprend sa taille naturelle, à l'utilisateur de faire défiler. */
	zoomed?: boolean
}>()

// Le bracket est dessiné dans un repère fixe, symétrique autour de x = 0, de
// hauteur BASE_HEIGHT. Sur un grand écran il est plus haut que large une fois
// étiré à 100 % de la largeur, et débordait donc en bas. On le limite
// désormais à la place disponible verticalement, et la largeur restante est
// distribuée dans les espaces entre les tours : les cases restent carrées
// (leeks et avatars non déformés), seuls les connecteurs s'allongent.
// 810 et non 805 : les noms sous la dernière rangée de cases débordaient de
// quelques pixels du viewBox, et se retrouvaient rognés.
const BASE_HEIGHT = 810
const BOTTOM_MARGIN = 16
const MIN_HEIGHT = 300
// Au-delà, sur une fenêtre très basse, les tours seraient si écartés que le
// bracket ne se lirait plus : on cesse d'étirer et on centre (marges latérales).
const MAX_STRETCH = 2

// Bandes horizontales occupées par chaque tour, de gauche à droite : cases du
// tour + case de combat. À l'intérieur d'une bande sx() est une simple
// translation : les cases gardent leur taille et les traits restent collés à
// leurs bords. La finale et le vainqueur ne passent pas par sx() : ils sont au
// sommet du bracket et restent centrés, les demi-finales s'écartant sous eux.
const BANDS_32 = [[-470, -340], [-300, -240], [-210, -140], [-120, -40], [40, 120], [140, 210], [240, 300], [340, 470]]
const BANDS_64 = [[-610, -500], ...BANDS_32, [500, 610]]

const svg = useTemplateRef<SVGSVGElement>('svg')
const width = ref(0)
const available = ref(0)

const bands = computed(() => props.tournament.size === 64 ? BANDS_64 : BANDS_32)
const baseWidth = computed(() => props.tournament.size === 64 ? 1234 : 954)

// Tant que rien n'est mesuré (premier rendu), on garde le repère d'origine et
// on laisse le SVG se dimensionner tout seul.
const scale = computed(() => width.value && available.value ? Math.min(width.value / baseWidth.value, available.value / BASE_HEIGHT) : 0)
const vbWidth = computed(() => scale.value ? Math.min(baseWidth.value * MAX_STRETCH, Math.max(baseWidth.value, Math.round(width.value / scale.value))) : baseWidth.value)
const height = computed(() => scale.value ? Math.round(BASE_HEIGHT * scale.value) : 0)
const viewBox = computed(() => (-vbWidth.value / 2) + ' -400 ' + vbWidth.value + ' ' + BASE_HEIGHT)

// Décalage de chaque bande : elles s'écartent du centre, chaque espace
// grandissant proportionnellement à sa largeur d'origine.
const offsets = computed(() => {
	const list = bands.value
	const gaps = list.slice(1).map((band, i) => band[0] - list[i][1])
	const total = gaps.reduce((a, gap) => a + gap, 0)
	const extra = vbWidth.value - baseWidth.value
	let offset = -extra / 2
	const result = [offset]
	for (const gap of gaps) {
		offset += extra * gap / total
		result.push(offset)
	}
	return result
})

/** Position horizontale finale d'un x du repère de dessin. */
function sx(x: number) {
	const list = bands.value
	const offset = offsets.value
	for (let i = 0; i < list.length; i++) {
		if (x > list[i][1]) continue
		if (i === 0 || x >= list[i][0]) return x + offset[i]
		// Dans l'espace entre deux bandes : transition linéaire d'un décalage à l'autre.
		const ratio = (x - list[i - 1][1]) / (list[i][0] - list[i - 1][1])
		return x + offset[i - 1] + (offset[i] - offset[i - 1]) * ratio
	}
	return x + offset[offset.length - 1]
}

/**
 * Points d'un connecteur, x étirés. Les segments verticaux le restent.
 * `moved` limite l'étirement aux premiers points : les suivants rejoignent la
 * finale, qui elle ne bouge pas.
 */
function L(points: string, moved = Infinity) {
	const values = points.split(/[\s,]+/).filter(value => value.length).map(Number)
	const result = []
	for (let i = 0; i < values.length; i += 2) {
		const x = i / 2 < moved ? sx(values[i]) : values[i]
		result.push(x + ' ' + values[i + 1])
	}
	return result.join(', ')
}

const ROUNDS = ['thirtyseconds', 'sixteenths', 'eighths', 'quarters', 'semifinals', 'finals']

// Le participant qui emprunte le trait sortant d'un match est celui qui apparaît
// au tour suivant, à la place correspondante (les matchs 2i et 2i+1 alimentent
// les deux cases du match i). Rien encore joué : rien à mettre en valeur.
function traveler(round: string, index: number): TournamentEntry | null {
	const next = ROUNDS[ROUNDS.indexOf(round) + 1]
	if (!next) return champion.value
	const match = props.tournament.rounds[next]?.[index >> 1]
	return match ? match.contestants[index & 1] : null
}

const champion = computed<TournamentEntry | null>(() => props.tournament.winner?.name ? props.tournament.winner : null)
// Les cases s'y comparent elles-mêmes pour se border d'or.
provide(CHAMPION, champion)

/** Chemin du vainqueur en doré, celui de nos participants en vert. */
function lineClass(round: string, index: number) {
	const entry = traveler(round, index)
	if (!entry || !entry.name) return null
	if (sameEntry(champion.value, entry)) return 'champion'
	if (entry.me) return 'mine'
	return null
}

function measure() {
	if (!svg.value) return
	if (props.zoomed) {
		width.value = 0
		return
	}
	const rect = svg.value.getBoundingClientRect()
	width.value = rect.width
	// Position dans la page (et non à l'écran) pour que le résultat ne dépende
	// pas du défilement au moment de la mesure.
	const top = Math.max(0, rect.top + window.scrollY)
	available.value = Math.max(MIN_HEIGHT, window.innerHeight - top - BOTTOM_MARGIN)
}

let observer: ResizeObserver | undefined
onMounted(() => {
	measure()
	observer = new ResizeObserver(measure)
	if (svg.value?.parentElement) observer.observe(svg.value.parentElement)
	window.addEventListener('resize', measure)
})
onBeforeUnmount(() => {
	observer?.disconnect()
	window.removeEventListener('resize', measure)
})
// flush post : la classe .zoomed du conteneur doit être appliquée avant de mesurer.
watch(() => props.zoomed, measure, { flush: 'post' })

const thirtyseconds = computed(() => props.tournament.rounds.thirtyseconds)
const sixteenths = computed(() => props.tournament.rounds.sixteenths)
const eighths = computed(() => props.tournament.rounds.eighths)
const quarters = computed(() => props.tournament.rounds.quarters)
const semifinals = computed(() => props.tournament.rounds.semifinals)
const finals = computed(() => props.tournament.rounds.finals)
</script>

<style lang="scss" scoped>
svg.tournament {
	display: block;
	width: 100%;
	// Trait du bracket, hérité par les cases et les combats (variables CSS : la
	// portée `scoped` ne les arrête pas). En sombre, `--background-disabled`
	// (#2A2F2C) se perd sur le fond du panneau : on prend l'encre éteinte, celle
	// qui cerne déjà les avatars du redesign.
	--bracket-line: var(--background-disabled);
}
body.dark svg.tournament {
	--bracket-line: var(--text-color-faint);
}
.tooltip {
	transform: translate(-50%, 0px);
	opacity: 0.9;
	z-index: 10;
}
.line {
	stroke: var(--bracket-line);
	stroke-width: 3;
	fill: none;
}
// Chemins mis en valeur : le vainqueur du tournoi en doré, nos participants en
// vert. Un poil plus épais, sinon la couleur seule se lit mal sur 3 px.
.line.mine {
	stroke: var(--primary);
	stroke-width: 4;
}
.line.champion {
	stroke: var(--gold);
	stroke-width: 4;
}
.grey {
	filter: grayscale(100%);
	opacity: 0.2;
}
</style>
