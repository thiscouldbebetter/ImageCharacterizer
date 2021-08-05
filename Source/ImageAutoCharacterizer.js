
class ImageAutoCharacterizer
{
	constructor
	(
		imageToCharacterizeAsCanvas,
		colorBackgroundRGB,
		pixelDifferenceMax,
		pixelsAllowedToViolateThreshold
	)
	{
		this.imageToCharacterizeAsCanvas = imageToCharacterizeAsCanvas;
		this.colorBackgroundRGB = colorBackgroundRGB;
		this.pixelDifferenceMax = pixelDifferenceMax;
		this.pixelsAllowedToViolateThreshold = pixelsAllowedToViolateThreshold;

		this.boxSelected = null;
	}

	static default()
	{
		return new ImageAutoCharacterizer();
	}

	imageSize()
	{
		var returnValue = new Coords
		(
			this.imageToCharacterizeAsCanvas.width,
			this.imageToCharacterizeAsCanvas.height
		);

		return returnValue;
	}

	toCanvas()
	{
		// Draw the image itself.

		var d = document;

		var imageSize = this.imageSize();

		var imageCharacterizedAsCanvas =
			d.createElement("canvas");

		imageCharacterizedAsCanvas.width = imageSize.x;
		imageCharacterizedAsCanvas.height = imageSize.y;
		imageCharacterizedAsCanvas.style = "border:1px solid";

		var imageCharacterizedAsGraphics = imageCharacterizedAsCanvas.getContext("2d");

		var characterizer = this;

		imageCharacterizedAsCanvas.onmousedown = (mouseEvent) =>
		{
			var clickPos = new Coords
			(
				mouseEvent.offsetX, mouseEvent.offsetY
			);
			var boxContainingClick = characterizer.boxesForWords.filter
			(
				box => box.containsPoint(clickPos)
			)[0];
			if (boxContainingClick != null)
			{
				this.boxSelect(boxContainingClick);
			}
		};

		imageCharacterizedAsGraphics.drawImage
		(
			this.imageToCharacterizeAsCanvas,
			0, 0
		);

		// Draw everything.

		imageCharacterizedAsGraphics.strokeStyle = "Cyan";

		for (var i = 0; i < this.boxesForWords.length; i++)
		{
			var box = this.boxesForWords[i];
			box.drawToGraphics(imageCharacterizedAsGraphics);
		}

		this.imageCharacterizedAsCanvas = imageCharacterizedAsCanvas;

		return this.imageCharacterizedAsCanvas;
	}

	boxSelect(boxToSelect)
	{
		this.boxSelected = boxToSelect;
		var boxContentsAsCanvas = this.boxSelected.toCanvas
		(
			this.imageToCharacterizeAsCanvas
		);

		var d = document;
		var divBoxSelected = d.getElementById("divBoxSelected");
		divBoxSelected.innerHTML = "";
		divBoxSelected.appendChild(boxContentsAsCanvas);
	}

	boxSelectNext()
	{
		var boxToSelectIndex = this.boxSelectedIndex();

		if (boxToSelectIndex == null)
		{
			boxToSelectIndex = 0;
		}
		else
		{
			boxToSelectIndex++;
			if (boxToSelectIndex > this.boxesForWords.length)
			{
				boxToSelectIndex = 0;
			}
		}

		var boxToSelect = this.boxesForWords[boxToSelectIndex];
		this.boxSelect(boxToSelect);
	}

	boxSelectPrev()
	{
		var boxToSelectIndex = this.boxSelectedIndex();

		if (boxToSelectIndex == null)
		{
			boxToSelectIndex = this.boxesForWords.length - 1;
		}
		else
		{
			boxToSelectIndex--;
			if (boxToSelectIndex < 0)
			{
				boxToSelectIndex = this.boxesForWords.length - 1;
			}
		}

		var boxToSelect = this.boxesForWords[boxToSelectIndex];
		this.boxSelect(boxToSelect);
	}

	boxSelectedIndex()
	{
		var returnValue =
		(
			this.boxSelected == null
			? null
			: this.boxesForWords.indexOf(this.boxSelected)
		);
		return returnValue;
	}

	boxesForWordsCalculate()
	{
		var imageToCharacterizeAsGraphics =
			this.imageToCharacterizeAsCanvas.getContext("2d");

		var imageSize = this.imageSize();

		var lines = this.boxesForWordsCalculate_1_Lines
		(
			imageToCharacterizeAsGraphics, imageSize
		);

		this.boxesForWords = this.boxesForWordsCalculate_2_Boxes
		(
			imageToCharacterizeAsGraphics, imageSize, lines
		);

		return this.boxesForWords;
	}

	boxesForWordsCalculate_1_Lines
	(
		imageToCharacterizeAsGraphics, imageSize
	)
	{
		// Locate the spaces between lines of text.

		var imageBoundsAsBox = new Box(new Coords(0, 0), imageSize);

		var spacesBetweenLinesOfText = this.findSpacesForGraphicsInBox
		(
			this.imageToCharacterizeAsCanvas,
			imageToCharacterizeAsGraphics,
			imageBoundsAsBox,
			1, // spaceDimensionInPixelsMin
			1 // axisI = y
		);

		var lines = [];

		//lines.push(...spacesBetweenLinesOfText);

		var lineBoundsAsBox = new Box(new Coords(), new Coords());
		for (var i = 0; i < spacesBetweenLinesOfText.length - 1; i++)
		{
			var lineTop = spacesBetweenLinesOfText[i];
			var lineBottom = spacesBetweenLinesOfText[i + 1];
			lineBoundsAsBox.min.overwriteWith(lineTop.fromPos);
			lineBoundsAsBox.max.overwriteWith(lineBottom.toPos);

			var spacesBetweenCharactersInLine = this.findSpacesForGraphicsInBox
			(
				this.imageToCharacterizeAsCanvas,
				imageToCharacterizeAsGraphics,
				lineBoundsAsBox,
				3, // spaceDimensionInPixelsMin
				0 // axisI = x
			);

			lines.push(...spacesBetweenCharactersInLine);
		}

		return lines;
	}

	boxesForWordsCalculate_2_Boxes(imageToCharacterizeAsGraphics, imageSize, lines)
	{
		// Convert the lines to boxes.

		var boxes = Box.manyFromLines(lines);

		// Remove any empty boxes.

		var pixelsMaxForBoxToBeConsideredEmpty = 0;

		var boxesNotEmpty = boxes.filter
		(
			box => this.countPixelsInBoxViolatingDifferenceMax(
				box, imageToCharacterizeAsGraphics
			) > pixelsMaxForBoxToBeConsideredEmpty
		);

		var boxesSorted = boxesNotEmpty.sort
		(
			(a, b) =>
			{
				var returnValue =
					(a.min.y * imageSize.x + a.min.x)
					- (b.min.y * imageSize.x + b.min.x);
				return returnValue;
			}
		);

		return boxesSorted;
	}

	findSpacesForGraphicsInBox
	(
		imageToSplitAsCanvas,
		imageToSplitAsGraphics,
		box,
		spaceDimensionInPixelsMin,
		axisI
	)
	{
		var imageToSplitSize = new Coords
		(
			imageToSplitAsCanvas.width,
			imageToSplitAsCanvas.height
		);

		var pixelPos = new Coords();

		var linesOpen = [];

		var axisJ = 1 - axisI;

		var min = box.min;
		var max = box.max;

		var iMin = min.dimension(axisI);
		var iMax = max.dimension(axisI);

		var jMin = min.dimension(axisJ);
		var jMax = max.dimension(axisJ);

		for (var i = iMin; i < iMax; i++)
		{
			pixelPos.dimensionSet(axisI, i);

			var isLineOpen = true;

			for (var direction = 0; direction < 2; direction++)
			{
				var jStart = (direction == 0 ? jMin : jMax - 1);
				var jEnd = (direction == 0 ? jMax : jMin - 1);
				var jStep = (direction == 0 ? 1 : -1);

				var pixelsOutsideThresholdOnLine = 0;

				for (var j = jStart; j != jEnd; j += jStep)
				{
					pixelPos.dimensionSet(axisJ, j);

					var pixelDifference =
						this.pixelDifferenceFromBackground
						(
							imageToSplitAsGraphics,
							pixelPos
						);

					var isPixelWithinThreshold =
						(pixelDifference <= this.pixelDifferenceMax);

					if (isPixelWithinThreshold == false)
					{
						pixelsOutsideThresholdOnLine++;
						if (pixelsOutsideThresholdOnLine > this.pixelsAllowedToViolateThreshold)
						{
							isLineOpen = false;
							break;
						}
					}

				} // end for j

				if (isLineOpen == false)
				{
					break;
				}

			} // end for d

			if (isLineOpen == true)
			{
				var lineOpen = new Line
				(
					new Coords().dimensionSet
					(
						axisJ, jMin
					).dimensionSet
					(
						axisI, i
					),
					new Coords().dimensionSet
					(
						axisJ, jMax
					).dimensionSet
					(
						axisI, i
					)
				);

				linesOpen.push(lineOpen);
			}

		} // end for i

		var lineGroupCurrent = [];
		var lineGroups = [];
		var linePrev = null;

		for (var i = 0; i < linesOpen.length; i++)
		{
			var line = linesOpen[i];

			if (linePrev != null)
			{
				var distanceBetweenLineAndPrev =
					line.fromPos.dimension(axisI)
					- linePrev.fromPos.dimension(axisI);

				if (distanceBetweenLineAndPrev > 1)
				{
					lineGroups.push(lineGroupCurrent);
					lineGroupCurrent = [];
				}
			}

			lineGroupCurrent.push(line);

			linePrev = line;
		}

		lineGroups.push(lineGroupCurrent);

		var linesSpaced = [];

		for (var g = 0; g < lineGroups.length; g++)
		{
			var lineGroup = lineGroups[g];

			/*
			var indexOfLineAtCenterOfGroup
				= Math.floor(lineGroup.length / 2);

			var lineAtCenterOfGroup = lineGroup[indexOfLineAtCenterOfGroup];

			linesSpaced.push(lineAtCenterOfGroup);
			*/

			var spaceDimensionInPixels = lineGroup.length;
			if (spaceDimensionInPixels >= spaceDimensionInPixelsMin)
			{
				linesSpaced.push(lineGroup[0]);
				linesSpaced.push(lineGroup[lineGroup.length - 1]);
			}
		}

		var linesForSpaces = linesSpaced;

		return linesForSpaces;
	}

	countPixelsInBoxViolatingDifferenceMax(box, graphics)
	{
		var numberOfPixelsViolatingDifferenceMaxSoFar = 0;

		var boxMin = box.min;
		var boxMax = box.max;
		var pixelPos = new Coords();

		for (var y = boxMin.y; y < boxMax.y; y++)
		{
			pixelPos.y = y;

			for (var x = boxMin.x; x < boxMax.x; x++)
			{
				pixelPos.x = x;

				var pixelDifference = this.pixelDifferenceFromBackground
				(
					graphics, pixelPos
				);

				if (pixelDifference > this.pixelDifferenceMax)
				{
					numberOfPixelsViolatingDifferenceMaxSoFar++;
				}
			}
		}

		return numberOfPixelsViolatingDifferenceMaxSoFar;
	}

	pixelDifferenceFromBackground(graphics, pixelPos)
	{
		var pixelRGB = graphics.getImageData
		(
			pixelPos.x, pixelPos.y, 1, 1
		).data;

		var pixelDifference = 0;
		var numberOfColorComponents = 3; // rgb

		for (var c = 0; c < numberOfColorComponents; c++)
		{
			var componentDifference = Math.abs
			(
				pixelRGB[c] - this.colorBackgroundRGB[c]
			);
			pixelDifference += componentDifference;
		}

		return pixelDifference;
	}

	splitBoxSelectedByCharsSpecified()
	{
		var charWidthsAsFractionsOfWhole = [];

		var d = document;

		var inputTextInBoxSelected =
			d.getElementById("inputTextInBoxSelected");

		var textInBoxSelected = inputTextInBoxSelected.value;

		var boxSelected = this.boxSelected;

		boxSelected.textSelected = textInBoxSelected;

		var graphics =
			this.imageToCharacterizeAsCanvas.getContext("2d");

		var widthOfWhole = graphics.measureText(textInBoxSelected).width;

		for (var i = 0; i < textInBoxSelected.length; i++)
		{
			var char = textInBoxSelected[i];
			var widthOfCharSingle = graphics.measureText(char).width;
			var charWidthAsFractionOfWhole =
				widthOfCharSingle / widthOfWhole;
			charWidthsAsFractionsOfWhole.push(charWidthAsFractionOfWhole);
		}

		boxSelected.charWidthsAsFractionsOfWhole =
			charWidthsAsFractionsOfWhole;

		var imageCharacterizedAsGraphics =
			this.imageCharacterizedAsCanvas.getContext("2d");
		boxSelected.drawToGraphics(imageCharacterizedAsGraphics);
	}
}
