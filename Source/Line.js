
class Line
{
	constructor(fromPos, toPos)
	{
		this.fromPos = fromPos;
		this.toPos = toPos;
	}

	drawToGraphics(graphics)
	{
		graphics.beginPath();
		graphics.moveTo(this.fromPos.x, this.fromPos.y);
		graphics.lineTo(this.toPos.x, this.toPos.y);
		graphics.stroke();
	}
}
