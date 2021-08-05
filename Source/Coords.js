
class Coords
{
	constructor(x, y)
	{
		this.x = x || 0;
		this.y = y || 0;
	}

	clone()
	{
		return new Coords(this.x, this.y);
	}

	dimension(dimensionIndex, valueToSet)
	{
		return (dimensionIndex == 0 ? this.x : this.y);
	}

	dimensionSet(dimensionIndex, valueToSet)
	{
		if (dimensionIndex == 0)
		{
			this.x = valueToSet;
		}
		else
		{
			this.y = valueToSet;
		}

		return this;
	}

	overwriteWith(other)
	{
		this.x = other.x;
		this.y = other.y;

		return this;
	}

	subtract(other)
	{
		this.x -= other.x;
		this.y -= other.y;
		return this;
	}
}
