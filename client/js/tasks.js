/*
 * Lets initialize everything that we need
 */
var $tasks 				= $('#tasks'),
	$projects 			= $('#projects'),
	tasks 				= null,
	projects 			= null,
	currentProjectId 	= null,
	projectListView 	= null,
	taskListView 		= null,
	today 				= new Date(),
	tomorrow			= new Date(),
	serverUrl			= 'http://localhost/articles/tasks/server/index.php/';

/*
 * We'll add one day to the current date (we'll use it to pre-fill due date)
 */
tomorrow.setDate(today.getDate()+1);

/*
 * This is our Backbone model representation (as you can see attributes are the same as in the database table)
 */
Task = Backbone.Model.extend({
	/*
	 * We need to define default values which will be used in model creation (and to give Backbone some info what our model look like)
	 */
	defaults: {
		id: null,
		date_created: today.getFullYear() + '-' + (1 + today.getMonth()) + '-' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds(),
		date_due: tomorrow.getFullYear() + '-' + (1 + tomorrow.getMonth()) + '-' + tomorrow.getDate() + ' ' + tomorrow.getHours() + ':' + tomorrow.getMinutes() + ':' + tomorrow.getSeconds(),
		project_id : null,
		status: 0,
		task: ''
	},
	/*
	 * This is the URI where the Backbone will communicate with our server part
	 */
	urlRoot: serverUrl + 'task'
});

/*
 * We also need a collection object which will hold our models (so it will be able to communicate with Backbone views more easily)
 */
TaskCollection = Backbone.Collection.extend({
	/*
	 * Model which this collection will hold and manipulate
	 */
	model: Task,
	/*
	 * URI for fetching the tasks
	 */
	url: serverUrl + 'task'
});

/*
 * Project model
 */
Project = Backbone.Model.extend({
	defaults: {
		id: null,
		name: ''
	},
	urlRoot: serverUrl + 'project'
});

/*
 * Project collection model
 */
ProjectCollection = Backbone.Collection.extend({
	model: Project,
	url: serverUrl + 'project' 
});

/*
 * View for single project item (LI)
 */
ProjectItem = Backbone.View.extend({
	/*
	 * Defining the parent tag that will be created
	 */
	tagName: 'li',
	/*
	 * Constructor like method where we can do needed intializations
	 */
	initialize: function() {
		/*
		 * We are attaching context to render method
		 */
		this.render = _.bind(this.render, this);

		/*
		 * Defining template, we are loading underscore template here
		 */
		this.template = _.template($('#project-item').html());

		/*
		 * Bind any change in the model to render method
		 */
		this.model.bind('change', this.render);
	},
	/*
	 * Defining events which will trigger our methods
	 */
	events: {
		'dblclick a': 'edit',
		'click a': 'loadTasks'
	},
	/*
	 * Rendering template
	 */
	render: function() {
		/*
		 * Filling template with model attributes
		 */
		this.$el.html(this.template(this.model.attributes));
		return this;
	},
	/*
	 * Triggers when user double clicks on project
	 */
	edit: function() {
		/*
		 * Opening project dialog and filling it with current model (the one that was clicked)
		 */
		new ProjectDialog({model: this.model}).show();
	},
	/*
	 * Method which loads currently selected project tasks
	 */
	loadTasks: function() {
		/*
		 * First lets handle visual side of selecting a project, we'll remove active class for project that was selected earlier and 
		 * add class to currently selected project
		 */
		$projects.find('li.active').removeClass('active');
		this.$el.addClass('active');

		/*
		 * We also need to update project title (above the tasks table)
		 */
		$('#project-title span').html(this.model.get('name'));

		/*
		 * Cleaning bit, we'll remove tasks that was tied to project selected earlier
		 */
		$tasks.empty();

		/*
		 * We'll initialize new task colleci
		 */
		tasks = new TaskCollection();

		/*
		 * We'll assign current project ID to "global" variable as we need it on several other places
		 */
		currentProjectId = this.model.id;

		/*
		 * Lets fetch tasks for currently selected project (we can access currently selected project through this.model)
		 * processData param here only informs the system that params provided through data param needs to be added to URL as GET params
		 */
		tasks.fetch({data: {project: this.model.id}, processData: true, success: function() {
			/*
			 * Initializing task list view and passing tasks collection to it
			 */
			taskListView = new TaskList({
				collection: tasks,
				/*
				 * Telling view to which DOM elements it needs to attach itself
				 */
				el: $tasks
			});
			/*
			 * Rendering list view
			 */
			taskListView.render();
		}});
	}
});

/*
 * View for project list, collection of projects
 */
ProjectList = Backbone.View.extend({
	initialize: function() {
		_(this).bindAll('add', 'remove');

		/*
		 * Holder of single project views
		 */
		this._projects = [];
		
		/*
		 * For each element in collection we run the 'add' method
		 */
		this.collection.each(this.add);
		
		/*
		 * Binding collection events to our methods
		 */
		this.collection.bind('add', this.add);
    	this.collection.bind('remove', this.remove);
	},
	render: function() {
		/*
		 * Initializing and setting flag from which we'll know if our view was rendered or not
		 */
		this._rendered = true;

		/*
		 * We render single project items and append it to DOM element
		 */
		_(this._projects).each(function(item) {
			$projects.append(item.render().el);
		});
	},
	/*
	 * Method that fires when project item is added (either from collection after fetching or creating a new one)
	 */
	add: function(project) {
		var projectItem = new ProjectItem({model: project});
		/*
		 * Adding project item view to the list
		 */
		this._projects.push(projectItem);

		/*
		 * If view is rendered then we add our rendered item to this view
		 */
		if (this._rendered) {
			this.$el.append(projectItem.render().el);
		}
	},
	/*
	 * Fires when removing project item
	 */
	remove: function(project) {
		/*
		 * Determining which view we need to remove from markup
		 */
		var view = _(this._projects).select(function(cv) { return cv.model === project; })[0];
		if (this._rendered) {
			$(view.el).remove();
		}

		/*
		 * Triggering click to the first project item
		 */
		$projects.find('li:nth-child(2)').find('a').trigger('click');
	}
});

/*
 * Project dialog view, form for creating and editing projects
 */
ProjectDialog = Backbone.View.extend({
	/*
	 * Events which we are listening and their respective selectors that triggers them
	 */
	events: {
		'click .save-action': 'save',
		'click .close,.close-action': 'close',
		'change input': 'modify'
	},
	initialize: function() {
		this.template = _.template($('#project-dialog').html());
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
	/*
	 * Displaying the dialog
	 */
	show: function() {
		$(document.body).append(this.render().el);
	},
	/*
	 * Removing the dialog
	 */
	close: function() {
		this.remove();
	},
	/*
	 * Fires when we click save on the form
	 */
	save: function() {
		/*
		 * If this is new project it won't have the ID attribute defined
		 */
		if (null == this.model.id) {
			/*
			 * We are creating our model through its collection (this way we'll automatically update its views and persist it to DB)
			 */
			projects.create(this.model);
		} else {
			/*
			 * Simple save will persist the model to the DB and update its view
			 */
			this.model.save();
		}
		/*
		 * Hiding modal dialog window
		 */
		this.remove();
	},
	/*
	 * We listen to every change on forms input elements and as they have the same name as the model attribute we can easily update our model
	 */
	modify: function(e) {
		var attribute = {};
		/*
		 * We'll fetch name and value from element that triggered "change" event
		 */
		attribute[e.currentTarget.name] = e.currentTarget.value;
		this.model.set(attribute);
	}
});

/*
 * Single task view
 */
TaskItem = Backbone.View.extend({
	tagName: 'tr',
	initialize: function() {
		this.render = _.bind(this.render, this);
		this.template = _.template($('#task-item').html());
		this.model.bind('change', this.render);
	},
	events: {
		'dblclick': 'edit',
		'change input': 'modify',
		'click a.delete-action': 'delete'
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	},
	edit: function() {
		new TaskDialog({model: this.model}).show();
	},
	/*
	 * We are listening for status checkbox, it updates the model and presist status to the DB
	 */
	modify: function(e) {
		var status = e.currentTarget.checked ? 1 : 0;
		this.model.set({status: status});
		this.model.save();
		/*
		 * We'll add strikethrough class to the title and date just to visually distinguish finished from unfinished task
		 */
		if (status === 1) {
			this.$el.find('td').addClass('finished');
		} else {
			this.$el.find('td').removeClass('finished');
		}
	},
	/*
	 * Handling the deletion of item
	 */
	delete: function (e) {
		/*
		 * Deleting/destroying the model
		 */
		this.model.destroy();

		/*
		 * Removing the single view
		 */
		this.$el.remove();
		e.preventDefault();
	}
});

/*
 * Task list/collection view
 */
TaskList = Backbone.View.extend({
	initialize: function() {
		_(this).bindAll('add');

		this._tasks = [];
		
		this.collection.each(this.add);
		
		this.collection.bind('add', this.add);
	},
	render: function() {
		this._rendered = true;
		this.$el.empty();
		_(this._tasks).each(function(item) {
			$tasks.append(item.render().el);
		});
	},
	add: function(task) {
		var taskItem = new TaskItem({model: task});

		this._tasks.push(taskItem);

		if (this._rendered) {
			this.$el.append(taskItem.render().el);
		}
	}
});

/*
 * Modal dialog/form for creating or editing single task
 */
TaskDialog = Backbone.View.extend({
	/*
	 * As you may see we don't listen for change on input elements. We'll show a different strategy for fetching data here
	 */
	events: {
		'click .save-action': 'save',
		'click .close,.close-action': 'close'
	},
	initialize: function() {
		this.template = _.template($('#task-dialog').html());
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		/*
		 * We'll initialize datetime picker
		 */
		this.$el.find('#dp1').datetimepicker();
		return this;
	},
	show: function() {
		$(document.body).append(this.render().el);
	},
	close: function() {
		this.remove();
	},
	/*
	 * Handling the save click, adding item to collection and persisting data to DB
	 */
	save: function() {
		/*
		 * We'll save a reference to current context
		 */
		var that = this;

		/*
		 * Traversing input elements in current dialog
		 */
		$.each(this.$el.find('input'), function(i, item) {
			var attribute = {};
			/*
			 * Matching name and value
			 */
			attribute[item.name] = item.value;
			that.model.set(attribute);
		});

		/*
		 * Same logic as in the project dialog, different approach for new and modified task
		 */
		if (null == this.model.id) {
			/*
			 * Adding project ID information read from "global" variable
			 */
			this.model.set({project_id: currentProjectId});
			tasks.create(this.model);
		} else {
			this.model.save();
		}
		this.remove();
	}
});

projects = new ProjectCollection();
/*
 * Fetching projects from DB
 */
projects.fetch({success: function() {
	projectListView = new ProjectList({
		collection: projects,
		el: $projects
	});
	projectListView.render();

	/*
	 * Triggering click on first project which will load its tasks
	 */
	$projects.find('li:nth-child(2)').find('a').trigger('click');
}});

/*
 * Attaching to "Add project" button
 */
$('#add-project').click(function(e) {
	var view = new ProjectDialog({model: new Project()});
	view.show();
	return false;
});

/*
 * Attaching to "Delete project (X)" button
 */
$('#remove-project').click(function(e) {
	projects.get(currentProjectId).destroy();
	return false;	
});

/*
 * Attaching to "Add task" button
 */
$('#add-task').click(function(e) {
	var view = new TaskDialog({model: new Task()});
	view.show();
	return false;
});