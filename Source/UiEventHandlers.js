
class UiEventHandlers
{
	static buttonImageCharacterize_Clicked()
	{
		var d = document;
		var divDisplayImageToCharacterize =
			d.getElementById("divDisplayImageToCharacterize");

		var imageToCharacterizeAsCanvas =
			divDisplayImageToCharacterize.getElementsByTagName("canvas")[0];

		if (imageToCharacterizeAsCanvas == null)
		{
			alert("No image loaded!");
			return;
		}

		var divDisplayImageCharacterized =
			d.getElementById("divDisplayImageCharacterized");
		divDisplayImageCharacterized.innerHTML = "";

		var inputColorBackground =
			d.getElementById("inputColorBackground");
		var inputPixelDifferenceThreshold =
			d.getElementById("inputPixelDifferenceThreshold");
		var inputpixelsAllowedToViolateThreshold =
			d.getElementById("inputpixelsAllowedToViolateThreshold");

		var colorBackgroundRGBAsString = inputColorBackground.value;
		var colorBackgroundRGBAsStrings = colorBackgroundRGBAsString.split(",");
		var colorBackgroundRGB = colorBackgroundRGBAsStrings.map(x => parseInt(x));
		var pixelDifferenceMax = inputPixelDifferenceThreshold.value;
		var pixelsAllowedToViolateThreshold = inputpixelsAllowedToViolateThreshold.value;

		var characterizer = new ImageAutoCharacterizer();
		var imageCharacterizedAsCanvas = characterizer.findCharactersInCanvas
		(
			imageToCharacterizeAsCanvas,
			colorBackgroundRGB,
			pixelDifferenceMax,
			pixelsAllowedToViolateThreshold
		);
		imageCharacterizedAsCanvas.style = "border:1px solid";

		divDisplayImageCharacterized.appendChild(imageCharacterizedAsCanvas);
	}

	static buttonImageCharacterizedClear_Clicked()
	{
		var d = document;
		var divDisplayImageCharacterized = d.getElementById
		(
			"divDisplayImageCharacterized"
		);

		divDisplayImageCharacterized.innerHTML = "";
	}

	static inputImageToCharacterize_Changed(input)
	{
		var file = input.files[0];
		var fileReader = new FileReader();
		fileReader.onload = (eventFileLoaded) =>
		{
			var imageAsDataURL = eventFileLoaded.target.result;

			var d = document;

			var imageAsDOMElement = d.createElement("img");
			imageAsDOMElement.onload = (eventImageLoaded) =>
			{
				var imageAsCanvas = d.createElement("canvas");
				imageAsCanvas.style = "border:1px solid";
				imageAsCanvas.width = imageAsDOMElement.width;
				imageAsCanvas.height = imageAsDOMElement.height;

				var graphics = imageAsCanvas.getContext("2d");
				graphics.drawImage(imageAsDOMElement, 0, 0);

				imageAsCanvas.onmousedown = (mouseEvent) =>
				{
					var x = mouseEvent.x;
					var y = mouseEvent.y;

					var pixelRGBA = graphics.getImageData
					(
						x, y, 1, 1
					).data;

					var pixelAsString =
						+ pixelRGBA[0] + ","
						+ pixelRGBA[1] + ","
						+ pixelRGBA[2]

					var inputColorBackground =
						d.getElementById("inputColorBackground");

					inputColorBackground.value = pixelAsString;
				}

				var divDisplayImageToCharacterize = d.getElementById
				(
					"divDisplayImageToCharacterize"
				);
				divDisplayImageToCharacterize.innerHTML = "";
				divDisplayImageToCharacterize.appendChild
				(
					imageAsCanvas
				);
			}
			imageAsDOMElement.src = imageAsDataURL;
		}
		fileReader.readAsDataURL(file);
	}
}
