# OM - Services module
This is the services module of OM, a custom-built startup management tool on NodeJS and React. OM helps startups manage the tasks and objectives of the team, as well as billing and alarms. 
This module supports the integrations and the frontend module. It handles all data storage and the REST API.

Note: An instance of MongoDB is required for this module.

# Installation
The following installation sequence explains how to set it up on Heroku, but feel free to use any server provider you want.

1. [Create a new Heroku app](https://devcenter.heroku.com/articles/creating-apps)

2. [Add mLab to your app](https://devcenter.heroku.com/articles/mongolab#adding-mlab-as-a-heroku-add-on)

3. [Set up the following environment variables on the newly created Heroku app](https://devcenter.heroku.com/articles/config-vars#managing-config-vars):
    * `OM_FRONTEND_URL`: URL of your installation of OM - Frontend module in the form `https://some-url.com:3100`
    * `OM_API_VERSION`: Use `1.0`
    * `AUTH_REQUIRED`: `true` to verify client auth, `false` to bypass authentication. (`true` recommended`)
    * `MONGODB_URI`: The connection string to the mongo instance. If using mLab, follow [this instructions](https://docs.mlab.com/connecting/) to get the connection string. (`mongodb://localhost/om`)
    * `SLACK_TOKEN`: A made-up token to use when authenticating a Slack user between the integrations module and the services module. (Just make up an ugly string).
    * `GIT_TOKEN`: A made-up token to use when authenticating a Git user between the integrations module and the services module. (Just make up an ugly string).
    * `TRELLO_TOKEN`: A made-up token to use when authenticating a Trello user between the integrations module and the services module. (Just make up an ugly string).
    * `EMAIL_TOKEN`: A made-up token to use when authenticating an Email account user between the integrations module and the services module. (Just make up an ugly string).
    
Note: The made-up token for Slack, Git, Trello and Email should match the ones used with the Integrations Module.
    
4. [Add the Heroku git remote to your local repo](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote)

5. [Push the code to Heroku](https://devcenter.heroku.com/articles/git#deploying-code)

6. Create an admin user that you can use to access the platform.
    * Connect to your MongoDB instance using `mongo <connectin string>` (for example, `mongo mongodb://heroku_asfasfas:asf098asf0987asf098@ds111111.mlab.com:123456/heroku_asfasfas`)
    * Run the following command: `db.users.insert({
	"username" : "admin",
	"password" : "admin",
	"first_name" : "Admin",
	"last_name" : "Admin",
	"email" : "some@email.com",
	"slack_account" : "",
	"trello_account" : "",
	"enabled" : true,
	"git_account" : "",
	"profile_image" : "",
	"is_freelancer" : false,
	"hourly_rate" : 0,
	"is_admin" : true,
	"notify_invoices" : false
})`
    * When the frontend module is installed, use the following URL to access: `[frontend-url]/#/login/null/YWRtaW4=:YWRtaW4=`

# Support
If you get stuck while installing this module or have any questions just hmu at nicolas@on-lab.com
