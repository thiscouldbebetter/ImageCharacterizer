
class ImageAutoCharacterizer
{
	findCharactersInCanvas
	(
		imageToFindCharactersInAsCanvas,
		colorBackgroundRGB,
		pixelDifferenceMax,
		pixelsAllowedToViolateThreshold
	)
	{
		// Draw the image itself.

		var d = document;

		var imageCharacterizedAsCanvas = d.createElement("canvas");

		var imageSize = new Coords
		(
			imageToFindCharactersInAsCanvas.width,
			imageToFindCharactersInAsCanvas.height
		);

		imageCharacterizedAsCanvas.width = imageSize.x;
		imageCharacterizedAsCanvas.height = imageSize.y;

		var graphics = imageCharacterizedAsCanvas.getContext("2d");
		graphics.drawImage
		(
			imageToFindCharactersInAsCanvas,
			0, 0
		);

		// Locate the spaces between lines of text.

		var spacesBetweenLinesOfText = this.findSpacesInCanvasInBox
		(
			imageToFindCharactersInAsCanvas,
			new Box(new Coords(0, 0), imageSize),
			1, // spaceDimensionInPixelsMin
			colorBackgroundRGB,
			pixelDifferenceMax,
			pixelsAllowedToViolateThreshold,
			1 // axisI = y
		);

		var lines = [];

		//lines.push(...spacesBetweenLinesOfText);

		for (var i = 0; i < spacesBetweenLinesOfText.length - 1; i++)
		{
			var lineTop = spacesBetweenLinesOfText[i];
			var lineBottom = spacesBetweenLinesOfText[i + 1];

			var spacesBetweenCharactersInLine = this.findSpacesInCanvasInBox
			(
				imageToFindCharactersInAsCanvas,
				new Box(lineTop.fromPos, lineBottom.toPos),
				1, // spaceDimensionInPixelsMin
				colorBackgroundRGB,
				pixelDifferenceMax,
				pixelsAllowedToViolateThreshold,
				0 // axisI = x
			);

			lines.push(...spacesBetweenCharactersInLine);
		}

		// Convert the lines to boxes.
		var boxes = Box.manyFromLines(lines);

		// Remove any empty boxes.

		var pixelsMaxForBoxToBeConsideredEmpty = 0;

		var boxesNotEmpty = boxes.filter
		(
			box => this.countPixelsInBoxViolatingDifferenceMax(
				box, pixelDifferenceMax, graphics, colorBackgroundRGB
			) > pixelsMaxForBoxToBeConsideredEmpty
		);

		// Draw everything.

		graphics.strokeStyle = "Cyan";

		for (var i = 0; i < boxesNotEmpty.length; i++)
		{
			var box = boxesNotEmpty[i];
			box.drawToGraphics(graphics);
		}

		return imageCharacterizedAsCanvas;
	}

	findSpacesInCanvasInBox
	(
		imageToSplitAsCanvas,
		box,
		spaceDimensionInPixelsMin,
		colorBackgroundRGB,
		pixelDifferenceMax,
		pixelsAllowedToViolateThreshold,
		axisI
	)
	{
		var graphics = imageToSplitAsCanvas.getContext("2d");

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
						this.pixelDifference
						(
							graphics,
							colorBackgroundRGB,
							pixelPos
						);

					var isPixelWithinThreshold =
						(pixelDifference <= pixelDifferenceMax);

					if (isPixelWithinThreshold == false)
					{
						pixelsOutsideThresholdOnLine++;
						if (pixelsOutsideThresholdOnLine > pixelsAllowedToViolateThreshold)
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

	countPixelsInBoxViolatingDifferenceMax
	(
		box, differenceMax, graphics, colorBackgroundRGB
	)
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

				var pixelDifference = this.pixelDifference
				(
					graphics, colorBackgroundRGB, pixelPos
				);

				if (pixelDifference > differenceMax)
				{
					numberOfPixelsViolatingDifferenceMaxSoFar++;
				}
			}
		}

		return numberOfPixelsViolatingDifferenceMaxSoFar;
	}

	pixelDifference
	(
		graphics,
		colorBackgroundRGB,
		pixelPos
	)
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
				pixelRGB[c] - colorBackgroundRGB[c]
			);
			pixelDifference += componentDifference;
		}

		return pixelDifference;
	}

}
