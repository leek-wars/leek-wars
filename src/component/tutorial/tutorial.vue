<template>
	<div>
		<div class="page-header page-bar">
			<h1>{{ $t('title') }}</h1>
		</div>

		<div class="panel">

			<div class="content">

				<div class="wrapper">
					<center>
						<img src="/image/map/nexus_block.png">
					</center>

					<center><h2>{{ $t('welcome') }}</h2></center>
					<br>
					<span class="justify" v-html="$t('intro')"></span>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2>{{ $t('menu') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">
					<div class="tuto-menu">
						<a href="#presentation">
							<div class="menu-item">
								<img src="/image/help/presentation.png"><br>
								{{ $t('presentation') }}
							</div>
						</a>
						<a href="#interface">
							<div class="menu-item">
								<img src="/image/help/interface.png"><br>
								{{ $t('interface') }}
							</div>
						</a>
						<a href="#variables">
							<div class="menu-item">
								<img src="/image/help/variables.png"><br>
								{{ $t('variables') }}
							</div>
						</a>
						<a href="#conditions">
							<div class="menu-item">
								<img src="/image/help/conditions.png"><br>
								{{ $t('conditions') }}
							</div>
						</a>
						<a href="#loops">
							<div class="menu-item">
								<img src="/image/help/loops.png"><br>
								{{ $t('loops') }}
							</div>
						</a>
						<a href="#functions">
							<div class="menu-item">
								<img src="/image/help/functions.png"><br>
								{{ $t('functions') }}
							</div>
						</a>
						<a href="#fight">
							<div class="menu-item">
								<img src="/image/help/fight_tuto.png"><br>
								{{ $t('fight') }}
							</div>
						</a>
						<a href="#advanced">
							<div class="menu-item">
								<img src="/image/help/advanced.png"><br>
								{{ $t('advanced') }}
							</div>
						</a>
					</div>
				</div>
			</div>
		</div>


		<div class="panel">

			<div class="header">
				<h2 id="presentation">{{ $t('presentation') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p v-html="$t('presentation_1')"></p>
					<p>{{ $t('presentation_2') }}</p>

					<h3>{{ $t('equip_a_weapon') }}</h3>

					<p>{{ $t('buy_a_weapon') }}</p>
					<p v-html="$t('buy_a_weapon_2')"></p>
					<p>{{ $t('buy_a_weapon_3') }}</p>

					<h3>{{ $t('what_is_leekscript') }}</h3>

					<p v-html="$t('what_is_leekscript_1')"></p>
					<p>{{ $t('what_is_leekscript_2') }}</p>

					<h3>{{ $t('what_is_ai') }}</h3>

					<p v-html="$t('what_is_ai_1')"></p>
					<p v-html="$t('what_is_ai_2')"></p>
					<p v-html="$t('what_is_ai_3')"></p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="interface">{{ $t('interface') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<h3>{{ $t('editor') }}</h3>

					<p v-html="$t('editor_1')"></p>

					<screen :legend="$t('editor_image_1')" src="/image/tuto/editor.jpg" />

					<p>{{ $t('editor_2') }}</p>
					<p>{{ $t('editor_3') }}</p>
					<p>{{ $t('editor_4') }}</p>

					<screen :legend="$t('editor_image_2')" src="/image/tuto/editor_ia.jpg" />

					<p v-html="$t('editor_5')"></p>

					<p>{{ $t('editor_6') }}<br>
						<ul>
							<li>{{ $t('editor_token_comments') }}</li>
							<li>{{ $t('editor_token_keywords') }}</li>
							<li>{{ $t('editor_token_numbers') }}</li>
							<li>{{ $t('editor_token_bool') }}</li>
							<li>{{ $t('editor_token_strings') }}</li>
						</ul>
					</p>

					<p>{{ $t('editor_7') }}</p>

					<p>{{ $t('editor_8') }}
						<ul>
							<li v-html="$t('editor.shortcut_1')"></li>
							<li v-html="$t('editor.shortcut_2')"></li>
							<li v-html="$t('editor.shortcut_3')"></li>
							<li v-html="$t('editor.shortcut_4')"></li>
							<li v-html="$t('editor.shortcut_5')"></li>
							<li v-html="$t('editor.shortcut_6')"></li>
							<li v-html="$t('editor.shortcut_7')"></li>
						</ul>
					</p>

					<p>
						<span v-html="$t('editor_9')"></span>
						<br>
						<br>
						{{ $t('editor_10') }}
					</p>

					<screen :legend="$t('automatic_completion')" src="/image/tuto/editor_autocomplete.jpg" />

					<br>
					<h3>{{ $t('do_a_test_fight') }}</h3>

					<p>{{ $t('editor_11') }}</p>

					<p>{{ $t('editor_12') }}</p>

					<screen :legend="$t('test_config')" src="/image/tuto/editor_test.jpg" />

					<p>{{ $t('editor_13') }}
						<ul>
							<li>{{ $t('difficulty_child') }}</li>
							<li>{{ $t('difficulty_easy') }}</li>
							<li>{{ $t('difficulty_medium') }}</li>
							<li>{{ $t('difficulty_hard') }}</li>
							<li>{{ $t('difficulty_evil') }}</li>
						</ul>
					</p>

					{{ $t('editor_15') }}

					<h3>{{ $t('documentation') }}</h3>

					<p v-html="$t('doc_1')"></p>

					<screen :legend="$t('the_documentation')" src="/image/tuto/documentation.jpg" />

					<p>{{ $t('doc_2') }}
						<ul>
							<li>{{ $t('doc_3') }}</li>
							<li>{{ $t('doc_4') }}</li>
							<li>{{ $t('doc_5') }}</li>
						</ul>
					</p>

					<p>{{ $t('doc_6') }}
						<ul>
							<li v-html="$t('doc_math')"></li>
							<li v-html="$t('doc_strings')"></li>
							<li v-html="$t('doc_arrays')"></li>
							<li v-html="$t('doc_leeks')"></li>
							<li v-html="$t('doc_weapons')"></li>
							<li v-html="$t('doc_chips')"></li>
							<li v-html="$t('doc_map')"></li>
							<li v-html="$t('doc_fight')"></li>
							<li v-html="$t('doc_util')"></li>
						</ul>
					</p>

					<p>{{ $t('doc_7') }}
						<ul>
							<li>{{ $t('doc_8') }}</li>
							<li>{{ $t('doc_9') }}</li>
							<li>{{ $t('doc_10') }}</li>
						</ul>
					</p>

					<p>{{ $t('doc_12') }}</p>

					<p>{{ $t('doc_13') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="variables">{{ $t('variables') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<h3>{{ $t('var_1') }}</h3>

					<p>{{ $t('var_2') }}
						<br>
						{{ $t('var_3') }}
						<ul>
							<li>{{ $t('var_4') }}</li>
							<li>{{ $t('var_5') }}</li>
							<li>{{ $t('var_6') }}</li>
							<li>{{ $t('var_7') }}</li>
							<li>{{ $t('var_8') }}</li>
						</ul>
					</p>

					<p>{{ $t('var_9') }}
						<br>
						<br>
						{{ $t('var_10') }}</p>

					<lw-code :code="$t('var_11')" />

					<p>{{ $t('var_12') }}</p>
					<lw-code :code="$t('var_13')" />

					<p>{{ $t('var_14') }}</p>
					<lw-code :code="$t('var_15')" />

					<p v-html="$t('var_16')"></p>

					<p>{{ $t('var_17') }}</p>

					<lw-code :code="$t('var_18')" />

					<p>{{ $t('var_19') }}</p>

					<lw-code :code="$t('var_20')" />

					<p>{{ $t('var_21') }}</p>

					<h3>{{ $t('var_22') }}</h3>

					<p>{{ $t('var_23') }}</p>

					<p v-html="$t('var_24')"></p>

					<lw-code :code="$t('var_25')" />

					<p>{{ $t('var_26') }}
						<ul>
							<li>{{ $t('var_27') }}</li>
							<li>{{ $t('var_28') }}</li>
							<li>{{ $t('var_29') }}</li>
							<li>{{ $t('var_30') }}</li>
							<li>{{ $t('var_31') }}</li>
						</ul>
					</p>

					<p>{{ $t('var_32') }}</p>

					<lw-code :code="$t('var_33')" />

					<p>{{ $t('var_34') }}</p>

					<lw-code :code="$t('var_35')" />


					<p>{{ $t('var_36') }}</p>

					<lw-code :code="$t('var_37')" />

					<p v-html="$t('var_38')"></p>

					<lw-code :code="$t('var_39')" />

					<p>{{ $t('var_40') }}</p>

					<lw-code :code="$t('var_41')" />

					<br>
					<h3>{{ $t('var_42') }}</h3>

					<p>{{ $t('var_43') }}</p>

					<p>{{ $t('var_44') }}</p>

					<p v-html="$t('var_45')"></p>

					<p>{{ $t('var_46') }}</p>

					<lw-code :code="$t('var_47')" />

					<p>{{ $t('var_48') }}</p>

					<screen :legend="$t('var_49')" src="/image/tuto/debug.jpg" />

					<p>{{ $t('var_50') }}</p>

					<p v-html="$t('var_51')"></p>

					<lw-code :code="$t('var_52')" />

					<p v-html="$t('var_53')"></p>

					<h3>{{ $t('arrays') }}</h3>

					<p>{{ $t('arr_1') }}</p>

					<p>{{ $t('arr_2') }}</p>

					<p>{{ $t('arr_3') }}</p>

					<p>{{ $t('arr_4') }}</p>

					<lw-code :code="$t('arr_5')" />

					<p v-html="$t('arr_6')"></p>

					<lw-code :code="$t('arr_7')" />

					<p>{{ $t('arr_8') }}</p>

					<lw-code :code="$t('arr_9')" />

					<p>{{ $t('arr_10') }}</p>
					<table v-html="$t('arr_11')"></table>

					<p>{{ $t('arr_12') }}</p>

					<lw-code :code="$t('arr_13')" />

					<p>{{ $t('arr_14') }}</p>

					<lw-code :code="$t('arr_15')" />

					<p>{{ $t('arr_16') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="conditions">{{ $t('conditions') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p v-html="$t('cond_1')"></p>

					<h3>{{ $t('cond_2') }}</h3>

					<p>{{ $t('cond_3') }}</p>

					<p>{{ $t('cond_4') }}</p>

					<lw-code :code="$t('cond_5')" />

					<p>{{ $t('cond_6') }}</p>

					<p v-html="$t('cond_7')"></p>

					<p>{{ $t('cond_8') }}</p>

					<lw-code :code="$t('cond_9')" />

					<p>{{ $t('cond_10') }}</p>

					<p>{{ $t('cond_11') }}</p>

					<lw-code :code="$t('cond_12')" />

					<p>{{ $t('cond_13') }}</p>

					<table v-html="$t('cond_14')"></table>

					<p>{{ $t('cond_15') }}</p>
					<table v-html="$t('cond_16')"></table>

					<p>{{ $t('cond_17') }}</p>

					<lw-code :code="$t('cond_18')" />

					<p v-html="$t('cond_19')"></p>

					<h3>{{ $t('cond_20') }}</h3>

					<p>{{ $t('cond_21') }}</p>

					<p>{{ $t('cond_22') }}</p>

					<p>{{ $t('cond_23') }}</p>

					<lw-code :code="$t('cond_24')" />

					<p>{{ $t('cond_25') }}</p>

					<lw-code :code="$t('cond_26')" />

					<p>{{ $t('cond_27') }}</p>

					<p>{{ $t('cond_28') }}</p>

					<lw-code :code="$t('cond_29')" />

					<p>{{ $t('cond_30') }}</p>

					<p>
						<span v-html="$t('cond_31')"></span>
						<ul>
							<li v-html="$t('cond_32')"></li>
							<li v-html="$t('cond_33')"></li>
							<li v-html="$t('cond_34')"></li>
							<li v-html="$t('cond_35')"></li>
						</ul>
					</p>
				</div>
			</div>
		</div>


		<div class="panel">

			<div class="header">
				<h2 id="loops">{{ $t('loops') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('loops_1') }}</p>

					<p>{{ $t('loops_2') }}</p>

					<h3>{{ $t('loops_3') }}</h3>

					<p>{{ $t('loops_4') }}</p>

					<p>{{ $t('loops_6') }}</p>

					<lw-code :code="$t('loops_7')" />

					<p v-html="$t('loops_8')"></p>

					<h3>{{ $t('loops_9') }}</h3>

					<p v-html="$t('loops_10')"></p>

					<lw-code :code="$t('loops_11')" />

					<h3>{{ $t('loops_12') }}</h3>

					<p v-html="$t('loops_13')"></p>

					<p>
						<span v-html="$t('loops_14')"></span>
						<ul>
							<li>{{ $t('loops_15') }}</li>
							<li>{{ $t('loops_16') }}</li>
							<li>{{ $t('loops_17') }}</li>
						</ul>
					</p>

					<p v-html="$t('loops_18')"></p>

					<lw-code :code="$t('loops_19')" />

					<p v-html="$t('loops_20')"></p>

					<p>{{ $t('loops_21') }}</p>

					<lw-code :code="$t('loops_22')" />

					<p v-html="$t('loops_23')"></p>

					<lw-code :code="$t('loops_24')" />
					<p>{{ $t('loops_25') }}</p>

					<p v-html="$t('loops_26')"></p>

					<lw-code :code="$t('loops_27')" />
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="functions">{{ $t('functions') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p>{{ $t('fun_1') }}</p>

					<h3>{{ $t('fun_2') }}</h3>

					<p v-html="$t('fun_3')"></p>

					<lw-code :code="$t('fun_4')" />

					<p v-html="$t('fun_5')"></p>

					<lw-code :code="$t('fun_6')" />

					<p v-html="$t('fun_7')"></p>

					<lw-code :code="$t('fun_8')" />

					<p v-html="$t('fun_9')"></p>

					<p v-html="$t('fun_10')"></p>

					<p v-html="$t('fun_11')"></p>

					<lw-code :code="$t('fun_12')" />

					<p>{{ $t('fun_13') }}</p>

					<lw-code :code="$t('fun_14')" />

					<p>{{ $t('fun_15') }}</p>

					<p v-html="$t('fun_16')"></p>

					<h3>{{ $t('fun_17') }}</h3>

					<p v-html="$t('fun_18')"></p>

					<p v-html="$t('fun_19')"></p>

					<lw-code :code="$t('fun_20')" />

					<p v-html="$t('fun_21')"></p>

					<lw-code :code="$t('fun_22')" />

					<h3>{{ $t('fun_23') }}</h3>

					<p>{{ $t('fun_24') }}</p>

					<lw-code :code="$t('fun_25')" />

					<p>{{ $t('fun_26') }}</p>

					<lw-code :code="$t('fun_27')" />

					<p>{{ $t('fun_28') }}</p>

					<p v-html="$t('fun_29')"></p>

					<p>{{ $t('fun_30') }}</p>

					<lw-code :code="$t('fun_31')" />

					<lw-code :code="$t('fun_32')" />

					<h3>{{ $t('fun_36') }}</h3>

					<p>{{ $t('fun_37') }}</p>

					<lw-code :code="$t('fun_38')" />

					<p>{{ $t('fun_39') }}</p>

					<lw-code :code="$t('fun_40')" />

					<p>{{ $t('fun_41') }}</p>

					<lw-code :code="$t('fun_42')" />

					<p>{{ $t('fun_43') }}</p>

					<p>{{ $t('fun_44') }}</p>

					<lw-code :code="$t('fun_45')" />

					<p>{{ $t('fun_46') }}</p>

					<lw-code :code="$t('fun_47')" />

					<p>{{ $t('fun_48') }}</p>

					<lw-code :code="$t('fun_49')" />

					<p>{{ $t('fun_50') }}</p>
				</div>
			</div>
		</div>

		<div class="panel">

			<div class="header">
				<h2 id="fight">{{ $t('fight') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p v-html="$t('fight_intro')"></p>

					<h2>{{ $t('fight_sys') }}</h2>

					<p v-html="$t('fight_sys_1')"></p>

					<h3>{{ $t('fight_sys_2') }}</h3>

					<p v-html="$t('fight_sys_3')"></p>

					<p v-html="$t('fight_sys_4')"></p>

					<lw-code :code="$t('fight_sys_5')" />

					<h3>{{ $t('fight_sys_6') }}</h3>
					<p v-html="$t('fight_sys_7')"></p>

					<p v-html="$t('fight_sys_8')"></p>

					<lw-code :code="$t('fight_sys_9')" />

					<p v-html="$t('fight_sys_10')"></p>

					<lw-code :code="$t('fight_sys_11')" />

					<p v-html="$t('fight_sys_12')"></p>

					<lw-code :code="$t('fight_sys_13')" />

					<h3>{{ $t('fight_ground') }}</h3>

					<p v-html="$t('fight_ground_1')"></p>

					<screen :legend="$t('fight_ground_2')" src="/image/tuto/grid_cells.jpg" />

					<p v-html="$t('fight_ground_3')"></p>

					<lw-code :code="$t('fight_ground_4')" />

					<h3>{{ $t('fight_ground_5') }}</h3>

					<p v-html="$t('fight_ground_6')"></p>

					<lw-code :code="$t('fight_ground_7')" />

					<p v-html="$t('fight_ground_8')"></p>

					<lw-code :code="$t('fight_ground_9')" />

					<p v-html="$t('fight_ground_10')"></p>

					<h3>{{ $t('fight_ground_11') }}</h3>

					<p v-html="$t('fight_ground_12')"></p>

					<lw-code :code="$t('fight_ground_13')" />

					<p><ul>
						<li v-html="$t('fight_ground_14')"></li>
						<li v-html="$t('fight_ground_15')"></li>
						<li v-html="$t('fight_ground_16')"></li>
						<li v-html="$t('fight_ground_17')"></li>
						<li v-html="$t('fight_ground_18')"></li>
					</ul></p>

					<p v-html="$t('fight_ground_19')"></p>

					<lw-code :code="$t('fight_ground_20')" />

					<h3>{{ $t('fight_weapons') }}</h3>

					<p v-html="$t('fight_weapons_2')"></p>

					<lw-code :code="$t('fight_weapons_3')" />

					<p v-html="$t('fight_weapons_4')"></p>

					<h3>{{ $t('fight_weapons_5') }}</h3>

					<p v-html="$t('fight_weapons_6')"></p>

					<lw-code :code="$t('fight_weapons_7')" />

					<h3>{{ $t('fight_chips') }}</h3>

					<p v-html="$t('fight_chips_1')"></p>

					<lw-code :code="$t('fight_chips_2')" />

					<h3>{{ $t('fight_chips_3') }}</h3>

					<p>{{ $t('fight_chips_4') }}</p>

					<p>{{ $t('fight_chips_5') }}</p>

					<p v-html="$t('fight_chips_6')"></p>

					<p>{{ $t('fight_chips_7') }}</p>

					<lw-code :code="$t('fight_chips_8')" />

					<p>{{ $t('fight_chips_9') }}</p>

					<lw-code :code="$t('fight_chips_10')" />


					<h3>{{ $t('fight_move') }}</h3>

					<p v-html="$t('fight_move_1')"></p>

					<h3>{{ $t('fight_move_2') }}</h3>

					<p v-html="$t('fight_move_3')"></p>

					<lw-code :code="$t('fight_move_4')" />

					<p v-html="$t('fight_move_5')"></p>

					<p v-html="$t('fight_move_6')"></p>

					<lw-code :code="$t('fight_move_7')" />

					<p v-html="$t('fight_move_8')"></p>

					<h3>{{ $t('fight_move_9') }}</h3>

					<p v-html="$t('fight_move_10')"></p>

					<h3>{{ $t('fight_move_11') }}</h3>

					<p v-html="$t('fight_move_12')"></p>

					<lw-code :code="$t('fight_move_13')" />

					<h3>{{ $t('fight_speak') }}</h3>

					<p v-html="$t('fight_speak_1')"></p>

					<lw-code :code="$t('fight_speak_2')" />
				</div>
			</div>
		</div>


		<div class="panel">

			<div class="header">
				<h2 id="advanced">{{ $t('advanced') }}</h2>
			</div>

			<div class="content">

				<div class="wrapper">

					<p v-html="$t('advanced_intro')"></p>

					<h3>{{ $t('advanced_order') }}</h3>

					<p v-html="$t('advanced_order_1')"></p>

					<lw-code :code="$t('advanced_order_2')" />

					<br>
					<h3>{{ $t('advanced_order_3') }}</h3>

					<p v-html="$t('advanced_order_4')"></p>

					<lw-code :code="$t('advanced_order_5')" />

					<h3>{{ $t('advanced_ref') }}</h3>

					<p>{{ $t('advanced_ref_1') }}</p>

					<lw-code :code="$t('advanced_ref_2')" />

					<p v-html="$t('advanced_ref_3')"></p>

					<lw-code :code="$t('advanced_ref_4')" />

					<p>{{ $t('advanced_ref_5') }}</p>

					<p>{{ $t('advanced_ref_6') }}</p>

					<lw-code :code="$t('advanced_ref_7')" />


					<h3>{{ $t('advanced_tern') }}</h3>

					<p>{{ $t('advanced_tern_1') }}</p>

					<lw-code :code="$t('advanced_tern_2')" />

					<p>{{ $t('advanced_tern_3') }}</p>

					<lw-code :code="$t('advanced_tern_4')" />

					<p>{{ $t('advanced_tern_5') }}</p>

					<lw-code :code="$t('advanced_tern_6')" />

					<p>{{ $t('advanced_tern_7') }}</p>


					<h3 id="includes">{{ $t('advanced_include') }}</h3>

					<p v-html="$t('advanced_include_1')"></p>

					<lw-code :code="$t('advanced_include_2')" />

					<p>{{ $t('advanced_include_3') }}</p>

					<p>{{ $t('advanced_include_4') }}</p>

					<h3>{{ $t('advanced_include_5') }}</h3>

					<p>{{ $t('advanced_include_6') }}</p>

					<lw-code :code="$t('advanced_include_7')" />

					<lw-code :code="$t('advanced_include_8')" />

					<lw-code :code="$t('advanced_include_9')" />

					<lw-code :code="$t('advanced_include_10')" />

					<br>
					<h3>{{ $t('advanced_include_11') }}</h3>

					<p>{{ $t('advanced_include_12') }}</p>

					<lw-code :code="$t('advanced_include_13')" />

					<br>
					<h3 id="triple_equals">{{ $t('advanced_triple_equal') }}</h3>

					<p v-html="$t('advanced_triple_equal_1')"></p>

					<table v-html="$t('advanced_triple_equal_2')"></table>

					<p v-html="$t('advanced_triple_equal_3')"></p>

					<table class="sign-table">
						<tr>
							<td>===</td>
							<td v-for="value in values" :key="value">{{ value }}</td>
						</tr>
						<tr v-for="value1 in values" :key="value1">
							<td>{{ value1 }}</td>
							<td v-for="(value2, j) in values" :key="j">
								<div v-if="value1 === value2" class="X"></div>
							</td>
						</tr>
					</table>

					<p v-html="$t('advanced_triple_equal_4')"></p>

					<table class="sign-table">
						<tr>
							<td>==</td>
							<td v-for="value in values" :key="value">{{ value }}</td>
						</tr>
						<tr v-for="(value1, i) in values" :key="i">
							<td>{{ value1 }}</td>
							<td v-for="(value2, j) in values" :key="j">
								<div v-if="equalEqual[i][j] === 'X'" class="X"></div>
							</td>
						</tr>
					</table>

					<p v-html="$t('advanced_triple_equal_5')"></p>

					<p v-html="$t('advanced_triple_equal_6')"></p>

					<p v-html="$t('advanced_triple_equal_7')"></p>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { LeekWars } from '@/model/leekwars'
	import { Component, Vue } from 'vue-property-decorator'
	import Screen from './screen.vue'
	
	@Component({ name: 'tutorial', i18n: {}, components: { Screen } })
	export default class Tutorial extends Vue {
		values = ['false', 'true', '0', '1', '12', '" "', '"0"', '"1"', '"12"', '"lama"',
					'"true"', '"false"', '[]', '[0]', '[1]', '[12]', '[1,2,3]', 'null']
		equalEqual = [
			'X X  XX    XXX    ', // false
			' X XX  XXXX   XXX ', // true
			'X X  XX    XXX    ', // 0
			' X X   X XX   X   ', // 1
			' X  X   X X    X  ', // 12
			'X X  X      XX    ', // " "
			'X X   X      X    ', // "0"
			' X X   X      X   ', // "1"
			' X  X   X      X  ', // "12"
			' X X     X        ', // "lama"
			' X XX     X   XXX ', // "true"
			'X X        XXX    ', // "false"
			'X X  X     XX     ', // []
			'X X  XX    X X    ', // [0]
			' X X   X  X   X   ', // [1]
			' X  X   X X    X  ', // [12]
			' X        X     X ', // [1,2,3]
			'                 X', // null
		]
		trophy: boolean = false
		created() {
			LeekWars.setTitle(this.$t('title'))
			window.addEventListener('scroll', this.scroll)
		}
		scroll(e: UIEvent) {
			if (window.scrollY + window.innerHeight + 300 > document.body.clientHeight) {
				if (!this.trophy) {
					LeekWars.post('trophy/unlock', {trophy_id: 46}) // Trophée Instruit
					this.trophy = true
				}
			}
		}
		destroyed() {
			window.removeEventListener('scroll', this.scroll)
		}
	}
</script>

<style lang="scss" scoped>
	.tuto-menu {
		text-align: center;
	}
	.menu-item {
		display: inline-block;
		vertical-align: bottom;
		margin: 10px;
		padding: 10px;
		text-align: center;
		width: 130px;
		height: 110px;
		border: 2px solid #ddd;
		background: white;
		font-weight: 300;
		color: #555;
		font-size: 18px;
		cursor: pointer;
	}
	.menu-item img {
		height: 70px;
		filter: grayscale(100%);
	}
	.menu-item:hover {
		border: 2px solid #5fad1b;
		color: #5fad1b;
	}
	.menu-item:hover img {
		filter: grayscale(0%);
	}
	.panel .content {
		background: rgba(100,100,100,0.1);
		padding: 0;
	}
	.panel .wrapper {
		max-width: 800px;
		margin: 0 auto;
		background: #f2f2f2;
		padding: 15px;
	}
	p {
		margin-bottom: 10px;
		margin-left: 20px;
		margin-right: 20px;
		text-align: justify;
		font-size: 16px;
	}
	li {
		margin-left: 20px;
	}
	code .CodeMirror {
		width: 90%;
		margin: 10px auto;
	}
	table {
		margin: 10px auto;
		background: white;
	}
	table /deep/ td, table /deep/ th {
		border: 1px solid #aaa;
		padding: 3px 10px;
		text-align: center;
	}
	a, .content /deep/ a {
		color: #5fad1b;
	}
	.sign-table {
		table-layout: fixed;
	}
	.sign-table td {
		width: 30px;
		height: 30px;
		max-width: 30px;
		min-width: 30px;
		padding: 0;
	}
	.sign-table tr td:first-child {
		width: 70px;
		max-width: 70px;
		background: #eee;
		font-weight: bold;
	}
	.sign-table tr:first-child {
		background: #eee;
	}
	.sign-table tr:first-child td:nth-child(n+2) {
		height: 70px;
		font-weight: bold;
		transform: rotate(-90deg);
	}
	.sign-table tr:first-child td:first-child {
		font-size: 20px;
	}
	.sign-table td .X {
		border-radius: 4px;
		content: " ";
		width: 82%;
		height: 82%;
		margin: 10%;
		background: #5fad1b;
	}
</style>