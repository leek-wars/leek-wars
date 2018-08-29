<div class='title'>{#changelog.version_online, version_name}</div>
<div class='content'>
	@foreach (change in changes)
		<div class='change'>➤ {{change}}</div>
	@end
	<br>
	{#changelog.see_all_changes}
</div>
<div class='actions'>
	<div class='dismiss'>{#changelog.popup_ok}</div>
</div>