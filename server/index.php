<?php

require_once 'NotORM.php';

$pdo = new PDO('mysql:dbname=tasks;host=localhost', 'root', 'root');
$db = new NotORM($pdo);

require_once 'Slim/Slim.php';

/*
 * Creating new Slim application
 */
$app = new Slim();

/*
 * Get tasks or single task (depending on whether ID was provided)
 */
$app->get('/task(/:id)', function ($id = null) use ($app, $db) {
    /*
     * We check if $id was provided
     * 
     * If it is, then we wish to fetch single task item, else we'll fetch whole set
     */
    if (null === $id) { 

        $data = array();
        /*
         * We're fetching tasks and filling an array that we'll return to the client
         */
        foreach ($db->task() as $task) {
            $data[] = array(
                'id' =>               $task['id'],
                'task' =>             $task['task'],
                'project_id' =>       $task['project_id'],
                'date_created' =>     $task['date_created'],
                'date_due' =>         $task['date_due'],
                'status' =>           $task['status']
            );
        }
        
        
    } else {
        $data = null;
        /*
         * We're fetching single task
         */
        if ($task = $db->task()->where('id', $id)->fetch()) {
            $data = array(
                'id' =>               $task['id'],
                'task' =>             $task['task'],
                'project_id' =>       $task['project_id'],
                'date_created' =>     $task['date_created'],
                'date_due' =>         $task['date_due'],
                'status' =>           $task['status']
            );
        }
    }
    
    /*
     * We'll output our result in JSON so we need to set 'Content-Type' HTTP header
     */
    $app->response()->header('Content-Type', 'application/json');
    
    /*
     * Outputing encoded $data
     */
    echo json_encode($data);
});

/*
 * Create new task
 */
$app->post('/task', function () use ($app, $db) {
    /*
     * We are reading JSON object received in HTTP request body and converting it to array
     */
    $task = (array) json_decode($app->request()->getBody());
    
    /*
     * Inserting new task to DB
     */
    $data = $db->task()->insert($task);

    /*
     * Again, setting appropriate HTTP 'Content-Type' header
     */
    $app->response()->header('Content-Type', 'application/json');
    
    /*
     * Outputing request
     */
    echo json_encode($data['id']);
});

/*
 * Updating existing task (hence the ID param)
 */
$app->put('/task/:id', function ($id) use ($app, $db) {
    /*
     * Fetching task for updating
     */
    $task = $db->task()->where('id', $id);
    $data = null;

    if ($task->fetch()) {
        /*
         * We are reading JSON object received in HTTP request body and converting it to array
         */
        $post = (array) json_decode($app->request()->getBody());

        /*
         * Updating task
         */
        $data = $task->update($post);
    }
    
    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data);
});

/*
 * Delete specified task
 */
$app->delete('/task/:id', function ($id) use ($app, $db) {
    /*
     * Fetching task for deleting
     */
    $task = $db->task()->where('id', $id);
    
    $data = null;
    if ($task->fetch()) {
        /*
         * Deleting task
         */
        $data = $task->delete();
    }
    
    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data);
});

/*
 * Get projects or single project (depending on whether ID was provided)
 */
$app->get('/project(/:id)', function ($id = null) use ($app, $db) {
    
    if (null === $id) { 
        $data = array();
        
        foreach ($db->project() as $project) {
            $data[] = array(
                'id' =>               $project['id'],
                'name' =>             $project['name']
            );
        }
        
        
    } else {
        $data = null;

        if ($project = $db->project()->where('id', $id)->fetch()) {
            $data = array(
                'id' =>               $project['id'],
                'name' =>             $project['name']
            );
        }
    }
    
    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data);
});

/*
 * Create new project
 */
$app->post('/project', function () use ($app, $db) {
    
    $project = (array) json_decode($app->request()->getBody());
    
    $data = $db->project()->insert($project);

    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data['id']);
});

/*
 * Updating existing project (hence the ID param)
 */
$app->put('/project/:id', function ($id) use ($app, $db) {
    
    $project = $db->project()->where('id', $id);
    $data = null;

    if ($project->fetch()) {
        
        $post = (array) json_decode($app->request()->getBody());
        $data = $project->update($post);
    }
    
    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data);
});

/*
 * Delete specified project
 */
$app->delete('/project/:id', function ($id) use ($app, $db) {
    
    $project = $db->project()->where('id', $id);
    $data = null;

    if ($project->fetch()) {
        $data = $project->delete();
    }
    
    $app->response()->header('Content-Type', 'application/json');
    echo json_encode($data);
});

/*
 * Runing the Slim app
 */
$app->run();