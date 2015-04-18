$(".form-group #directory-select").change(function() {
	var soundFiles = findSoundFiles($( ".form-group #directory-select" )[0].files);

	soundFiles.forEach(function(elem) {
//		var song = elem;

//		if (!isMp3(elem)) {
//			var postParameters = {
//				file: elem,
//				processData: false,
//				contentType: false
//			};
//
//			$.post("/mp3encode", postParameters, function(responseJSON) {
//				song = JSON.parse(responseJSON);
//				console.log(song);
//			});
//		}

		var url = elem.webkitRelativePath;

		ID3.loadTags(url, function() { //song.elem.name
			var tags = ID3.getAllTags(url);

			if (tags) {
				console.log(tags["TAL"].data + ", "
					+ tags["TP1"].data + ", "
					+ tags["TT2"].data + ", "
					+ tags["TYE"].data);
				var info = tags["TAL"].data + ", "
					+ tags["TP1"].data + ", "
					+ tags["TT2"].data + ", "
					+ tags["TYE"].data;
				$( ".songs-div .songs-ul" ).append( "<li id=\"" + info + "\">" + info + "</li>" );
			}
		},
		{tags: ["TAL", "TP1", "TT2", "TYE"]});

	});
});

function findSoundFiles(files) {
	var soundFiles = [];

	for (var i = 0; i < files.length; i++) {
		if (isAudio(files[i])) {
			soundFiles.push(files[i]);
		}
	}

	return soundFiles;
}

function isAudio(file) {
    return file.type.indexOf("audio") !== -1;
}

function isMp3(file) {
	return file.type.indexOf("mp3") !== -1;
}

//- send post request that has the path to the song
//http://www.sauronsoftware.it/projects/jave/manual.php?PHPSESSID=r6ctdckspp5nusoo4c3v9e42b6#10