class OperationsQueue
{
	constructor()
	{
		this._jobs = [];
		this._isRunning = false;
	}


	run()
	{
		if ( this._isRunning )
			return;

		this._isRunning = true;

		this.next();
	}


	stop()
	{
		this._isRunning = false;
	}


	add( callback, ...data )
	{
		this._jobs.push( {
			callback: callback,
			data: data
		} );

		if ( this._jobs.length == 1 )
			this.run();
	}


	next()
	{
		if ( this._jobs.length == 0 )
		{
			this.stop();

			return;
		}

		let job = this._jobs[0];

		this._jobs.splice( 0, 1 );

		job.callback( ...job.data );
	}
}