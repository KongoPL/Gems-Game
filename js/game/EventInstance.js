class EventInstance
{
	constructor()
	{
		this._listeners = [];
	}


	listen( callback )
	{
		if ( typeof callback !== 'function' )
			return false;

		this._listeners.push( callback );

		return true;
	}


	unlisten( callback )
	{
		this._listeners = this._listeners.filter( ( v ) => v !== callback );
	}


	emit( ...data )
	{
		for ( let callback of this._listeners )
			callback( ...data );
	}
}