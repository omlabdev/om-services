# OM - Services module
This is the services module of OM, a custom-built startup management tool on NodeJS and React. OM helps startups manage the tasks and objectives of the team, as well as billing and alarms.
This module supports the integrations and the frontend module. It handles all data storage and the REST API.

Note: An instance of MongoDB is required for this module.

# The full stack
This is one part of a tree-part app.
   * [Frontend Module](https://github.com/omlabdev/om-frontend/)
   * [Integrations Module](https://github.com/omlabdev/om-integrations)

# Inspiration and history

At [Om Lab](https://omlab.dev/) we were struggling to get more peace-of-mind about our billing and our tasks. Some of our founders use the [bullet journal](http://bulletjournal.com) method on notebooks, and we thought we could scale that and adopt it company-wide. That's how the first version of OM was born: just as a tool to keep track of the tasks at hand in a bullet journal kinda style.

At the same time, we were using a small app we wrote to track the hours worked for our different projects. So we decided to move the hour-tracking system into OM, and have it all in one place.

So we started adding some tasks into the system, but reality kicked in: most of our clients would send us tasks through email and teamwork. And moving the tasks manually into OM (and potencially forgetting about one) is not what we call peace-of-mind. So we integrated Teamwork, Email and, why not, Slack, the comm tool we use internally. We don't intend to make OM a task management tool though. Many exist and are more than enough for that. But just having them all in one place, where everyone can see them, assign, and track time, just in ***one*** place no matter the client.

Then our "numbers guys" wanted to see how we were doing in a glance. You know, to add another layer of peace-of-mind. We had the hours worked, the invoices we were sending, and we knew whether or not they're paid. So we combined all that to create an overview of the company, with a yearly and a monthly view. Now our numbers guy has so much more peace of mind and feels in control.

Sometimes we hire people for specific projects, under a freelancing contract. And when we do this is very important to keep a close watch at the ours they work because if they reach a certain point we start loosing money. So we needed another layer of peace of mind for this. And so the alarms were born. Now we can create an alarm that goes off if certain user records more than X amount of hours in a certain project. The freelancers can also go into OM and send us an invoice, which is already pre-filled with the hours they've executed. And when we accept it, it goes straight into the project's expenses. This way we know exactly how much profit we get for each project.

This, and a few more things, is OM. OM is peace... of... mind 🙌. Namaste. 🙏.

# Tech description

This module is built on NodeJS + Express + MongoDB

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

5. [Push the code to Heroku](https://devcenter.heroku.com/articles/git#deploying-code) (Note: if your pushing from the `dev` branch, do `git push heroku dev:master`)

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
If you get stuck while installing this module or have any questions just contact us at hello@omlab.dev
