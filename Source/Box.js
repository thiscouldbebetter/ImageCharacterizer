
class Box
{
	constructor(min, max)
	{
		this.min = min || new Coords();
		this.max = max || new Coords();
	}

	static manyFromLines(lines)
	{
		var returnValues = [];

		var linesVertical =
			lines.filter(line => line.fromPos.x == line.toPos.x);

		for (var x = 0; x < linesVertical.length - 1; x++)
		{
			var lineVerticalNear = linesVertical[x];
			var lineVerticalFar = linesVertical[x + 1];

			if (lineVerticalFar.fromPos.y == lineVerticalNear.fromPos.y)
			{
				var box = new Box
				(
					lineVerticalNear.fromPos,
					lineVerticalFar.toPos
				);

				returnValues.push(box);
			}
		}

		return returnValues;
	}

	containsPoint(pointToCheck)
	{
		var returnValue =
		(
			pointToCheck.x >= this.min.x
			&& pointToCheck.x <= this.max.x
			&& pointToCheck.y >= this.min.y
			&& pointToCheck.y <= this.max.y
		);

		return returnValue;
	}

	size()
	{
		return this.max.clone().subtract(this.min);
	}

	// Graphics.

	drawToGraphics(graphics)
	{
		var size = this.size();

		graphics.strokeRect
		(
			this.min.x, this.min.y,
			size.x, size.y
		);

		if (this.charWidthsAsFractionsOfWhole != null)
		{
			var drawX = 0;
			for (var i = 0; i < this.charWidthsAsFractionsOfWhole.length - 1; i++)
			{
				var charWidthAsFractionOfWhole =
					this.charWidthsAsFractionsOfWhole[i];
				var charWidthInPixels =
					charWidthAsFractionOfWhole * size.x;

				drawX += charWidthInPixels;

				graphics.moveTo(this.min.x + drawX, this.min.y);
				graphics.lineTo(this.min.x + drawX, this.max.y);
				graphics.stroke();
			}
		}
	}

	toCanvas(canvasToGetContentsFrom)
	{
		var d = document;

		var boxSize = this.size();

		var canvasForBoxContents = d.createElement("canvas");
		canvasForBoxContents.width = boxSize.x;
		canvasForBoxContents.height = boxSize.y;
		canvasForBoxContents.style = "border:1px solid";

		var graphicsForBoxContents =
			canvasForBoxContents.getContext("2d");

		graphicsForBoxContents.drawImage
		(
			canvasToGetContentsFrom,
			// source
			this.min.x, this.min.y, 
			boxSize.x, boxSize.y,
			// destination
			0, 0, 
			boxSize.x, boxSize.y
		);

		return canvasForBoxContents;
	}
}

