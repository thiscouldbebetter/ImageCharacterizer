
class Box
{
	constructor(min, max)
	{
		this.min = min;
		this.max = max;
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
	}
}
