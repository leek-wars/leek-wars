<template>
	<div v-show="LeekWars.squares.squares.length" class="squares">
		<component :is="square.link ? 'router-link' : 'div'" v-for="square in LeekWars.squares.squares" :key="square.id" v-ripple :to="square.link || undefined" class="square card" :class="{[square.clazz]: square.clazz, win: LeekWars.notifsResults && square.resultIcon === 'mdi-check', defeat: LeekWars.notifsResults && square.resultIcon === 'mdi-close'}" @click="click(square)">
			<v-icon v-if="square.icon" :class="{padding: square.padding}" class="image">{{ square.image }}</v-icon>
			<img v-else :src="square.image ?? undefined" :class="{padding: square.padding}" class="image">
			<div class="wrapper">
				<div class="title" v-html="square.title"></div>
				<div v-emojis class="message" v-html="square.message"></div>
			</div>
			<span v-if="square.resultIcon && LeekWars.notifsResults" class="result">
				<v-icon :class="square.resultIcon">{{ square.resultIcon }}</v-icon>
			</span>
		</component>
	</div>
</template>

<script setup lang="ts">
import '@/model/emojis'
import { LeekWars } from '@/model/leekwars'
import { store } from '@/model/store'
import { Square } from '@/model/squares'

defineOptions({ name: 'Squares' })

function click(square: Square) {
	if (square.notification) {
		LeekWars.post('notification/read', { notification_id: square.notification.id })
		store.commit('read-notification', square.notification.id)
	}
}
</script>

<style lang="scss" scoped>
	.squares {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 10000;
		padding: 20px;
	}
	.square {
		display: flex;
		margin-top: 10px;
		width: 300px;
		border-radius: var(--radius-tiny);
		box-shadow: 0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12);
		overflow: hidden;
		animation: in-and-out 5s;
		img.padding {
			opacity: 0.7;
		}
		i {
			font-size: 32px;
		}
	}

	body.dark .square:not(.notif-trophy):not(.notif-bigwin) img.padding {
		filter: invert(1);
		opacity: 1.0 !important;
	}
	@keyframes in-and-out {
		0% { transform: translate(150%, 0); }
		10% { transform: translate(0, 0); }
		90% { transform: translate(0, 0); }
		100% { transform: translate(150%, 0); }
	}
	.image {
		width: 60px;
		height: 60px;
		flex: 0 0 60px;
		margin-right: 8px;
	}
	.image.padding {
		width: 60px;
		height: 60px;
		flex: 0 0 60px;
		margin-right: 0;
		padding: 12px;
	}
	.wrapper {
		padding: 10px 0;
	}
	.title {
		font-size: 15px;
		margin-bottom: 4px;
	}
	.message {
		font-size: 14px;
	}
	.result {
		position: absolute;
		background: var(--white);
		height: 24px;
		width: 24px;
		border-radius: 50%;
		text-align: center;
		border-bottom: 2px solid var(--grey-11);
		border-right: 2px solid var(--grey-11);
		left: 2px;
		top: 2px;
		i {
			font-size: 20px;
			padding-top: 2px;
			padding-left: 2px;
			font-weight: bold;
		}
	}
	.result .mdi-check {
		color: green;
	}
	.result .mdi-close {
		color: red;
	}

	/* ===== v3 : une surface flottante du design system =====
	 * Le v2 gardait la carte Material (ombre floue, icône de 60 px, badge rond
	 * de résultat) et partait du bord bas de l'écran, où elle recouvrait le champ
	 * de saisie d'un chat ou du panneau social (retour de Pierre : « plus beau,
	 * plus fin, et qui ne commence pas tout en bas »). En v3 : panneau au trait
	 * avec l'ombre pixel (principe 1), liseré de 3 px à gauche qui dit la nature
	 * — vert par défaut, or et halo pour un trophée, bleu pour un bigwin (motif
	 * des rangées de notification), couleur du résultat pour un combat, si
	 * l'option « résultats dans les notifications » est active —, glyphe de
	 * 22 px, deux lignes au plus par texte, 280 px de large, et la pile démarre
	 * 88 px au-dessus du bord bas, la hauteur d'une barre de saisie. */
	body:not(.v2) .squares {
		bottom: 88px;
		right: 16px;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}
	body:not(.v2) .square {
		width: min(280px, calc(100vw - 32px));
		margin: 0;
		border-radius: 0;
		background: var(--panel-background);
		border: 1px solid var(--border-strong);
		border-left: 3px solid var(--notif-accent, var(--primary));
		box-shadow: var(--shadow-pixel);
		color: var(--text-color);
		align-items: center;
		gap: 10px;
		padding: 8px 12px 8px 10px;
	}
	body:not(.v2) .square.win {
		--notif-accent: var(--result-win);
	}
	body:not(.v2) .square.defeat {
		--notif-accent: var(--result-defeat);
	}
	/* Le halo des trophées et bigwins (shell), mais sur une surface OPAQUE : la
	   teinte du shell est posée sur du transparent, ce qui laisserait voir la
	   page à travers une carte flottante. */
	body:not(.v2) .square.notif-trophy,
	body:not(.v2) .square.notif-bigwin {
		background: color-mix(in srgb, var(--notif-accent) 10%, var(--panel-background));
		box-shadow: inset 0 0 14px color-mix(in srgb, var(--notif-accent) 22%, transparent), var(--shadow-pixel);
	}
	body:not(.v2) .square .image {
		width: 24px;
		height: 24px;
		flex: 0 0 24px;
		margin: 0;
		padding: 0;
		font-size: 22px;
		color: var(--notif-accent, var(--text-color-secondary));
		opacity: 1;
		filter: none;
	}
	/* Une image (trophée, avatar d'un correspondant) porte du détail : 32 px,
	   et l'avatar en carré bordé comme partout dans la coquille. */
	body:not(.v2) .square img.image {
		width: 32px;
		height: 32px;
		flex-basis: 32px;
		object-fit: contain;
	}
	body:not(.v2) .square img.image:not(.padding) {
		border: 1px solid var(--border-strong);
		object-fit: cover;
	}
	body:not(.v2) .square .wrapper {
		padding: 0;
		min-width: 0;
		flex: 1;
	}
	body:not(.v2) .square .title,
	body:not(.v2) .square .message {
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	body:not(.v2) .square .title {
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 2px;
	}
	body:not(.v2) .square .message {
		font-size: 12.5px;
		color: var(--text-color-secondary);
	}
	/* Le résultat n'est plus un badge rond collé dans le coin : un glyphe en bout
	   de ligne, dans la couleur du résultat, la même que le liseré. */
	body:not(.v2) .square .result {
		position: static;
		background: none;
		border: 0;
		border-radius: 0;
		width: auto;
		height: auto;
		flex: none;
		margin-left: auto;
	}
	body:not(.v2) .square .result i {
		font-size: 18px;
		padding: 0;
	}
	body:not(.v2) .square .result .mdi-check {
		color: var(--result-win);
	}
	body:not(.v2) .square .result .mdi-close {
		color: var(--result-defeat);
	}
	body:not(.v2) .square .result .mdi-equal {
		color: var(--text-color-secondary);
	}
</style>