<#assign content>
<div id="client-gui">
	<h2 class="title">Client</h2>
	<div id="client-prefs">
		<div class="form-group">
			<label for="server">Server Address</label>
			<input type="text" id="server-url" class="form-control" placeholder="127.0.0.1:4567"></input>
		</div>
		<div class="form-group">
			<label for="server">Password</label>
			<input type="password" id="server-url" class="form-control" placeholder="password1234"></input>
		</div>
		<div class="form-group">
			<label for="clientname">Client Name</label>
			<input type="text" id="client-name" class="form-control" placeholder="Dave's Room"></input>
		</div>
		<div class="form-group">
    		<label for="maxvolume">Max Volume</label>
			<div class="well">
			    <input type="range" id="client-volume" min="0" max="10" value="7"></input>
		    </div>
		</div>
		<button class="btn btn-default btn-block btn-primary">Connect</button>
	</div>
	<div id="client-canvas">
		<label for="=clientpositions">Click and drag your sound source</label></br>
		<canvas id="clients-canvas">
			
		</canvas>
	</div>
</div>
</#assign>

<#assign pagescripts>
	<script src="js/client.js"></script>
</#assign>
<#include "main.ftl">