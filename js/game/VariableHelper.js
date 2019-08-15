class VariableHelper
{
	static clone( variable )
	{
		if ( typeof variable == 'object' )
			return JSON.parse( JSON.stringify( variable ) );
		else
			return variable;
	}
}