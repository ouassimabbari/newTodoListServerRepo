const graphql = require('graphql');
const mongoose = require('mongoose');

const Note = require('../models/note');
const User = require('../models/user');
const Todo = require('../models/todo');

const {
    GraphQLObjectType, GraphQLString,
    GraphQLID, GraphQLSchema,
    GraphQLList, GraphQLNonNull,
    GraphQLBoolean
} = graphql;

const {
    GraphQLDateTime
} = require('graphql-iso-date');

const NoteType = new GraphQLObjectType({
    name: 'Note',
    fields: () => ({
        id: { type: GraphQLID },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        user: {
            type: UserType,
            resolve(parent, args) {
                return User.findById(parent.userID);
            }
        }
    })
});

const TodoType = new GraphQLObjectType({
    name: "Todo",
    fields: () => ({
        id: { type: GraphQLID },
        title: { type: GraphQLString },
        isCompleted: { type: GraphQLBoolean },
        forDate: { type: GraphQLDateTime },
        user: {
            type: UserType,
            resolve(parent, args) {
                return User.findById(parent.userID);
            }
        }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        notes: {
            type: new GraphQLList(NoteType),
            resolve(parent, args) {
                return Note.find({ userID: parent.id });
            }
        },
        todos: {
            type: new GraphQLList(TodoType),
            resolve(parent, args) {
                return Todo.find({ userID: parent.id })
            }
        }
    })
})

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        noteById: {
            type: NoteType,
            args: { id: { type: GraphQLNonNull(GraphQLID) } },
            resolve(parent, args) {
                return Note.findById(args.id);
            }
        },
        notes: {
            type: new GraphQLList(NoteType),
            resolve(parent, args) {
                return Note.find({});
            }
        },
        todoById: {
            type: TodoType,
            args: { id: { type: GraphQLNonNull(GraphQLID) } },
            resolve(parent, args) {
                return Todo.findById(args.id);
            }
        },
        todos: {
            type: new GraphQLList(TodoType),
            resolve(parent, args) {
                return Todo.find({});
            }
        },
        todosByDay: {
            type: new GraphQLList(TodoType),
            args: { forDate: { type: GraphQLNonNull(GraphQLString) } },
            resolve(parent, args) {
                var fullDateArray = args.forDate.split("-");
                var year = parseInt(fullDateArray[0]);
                var month = parseInt(fullDateArray[1]) - 1;
                var day = parseInt(fullDateArray[2]);
                var minDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
                var maxDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 0))
                return Todo.find({}).
                    where('forDate').
                    gt(minDate).
                    lt(maxDate).
                    sort({ forDate: 'desc' });
            }
        },
        userById: {
            type: UserType,
            args: { id: { type: GraphQLNonNull(GraphQLID) } },
            resolve(parent, args) {
                return User.findById(args.id);
            }
        },
        userByEmail: {
            type: UserType,
            args: { email: { type: GraphQLNonNull(GraphQLString) } },
            resolve: async (parent, { email }) => {
                const user = await User.findOne({ email });
                return user;
            }
        },
        users: {
            type: new GraphQLList(UserType),
            resolve(parent, args) {
                return User.find({});
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) },
                lastName: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                let user = new User({
                    firstName: args.firstName,
                    lastName: args.lastName,
                    email: args.email,
                    password: args.password,
                });
                return user.save();
            }
        },
        addNote: {
            type: NoteType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                description: { type: new GraphQLNonNull(GraphQLString) },
                userID: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                let note = new Note({
                    title: args.title,
                    description: args.description,
                    userID: args.userID
                })
                return note.save()
            }
        },
        addTodo: {
            type: TodoType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                forDate: { type: new GraphQLNonNull(GraphQLString) },
                isCompleted: { type: new GraphQLNonNull(GraphQLBoolean) },
                userID: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve(parent, args) {
                var fullDateArray = args.forDate.split("-");
                var year = parseInt(fullDateArray[0]);
                var month = parseInt(fullDateArray[1]) - 1;
                var day = parseInt(fullDateArray[2]);
                var hour = parseInt(fullDateArray[3]);
                var minute = parseInt(fullDateArray[4]);
                var second = parseInt(fullDateArray[5]);
                let todo = new Todo({
                    title: args.title,
                    forDate: new Date(Date.UTC(year, month, day, hour, minute, second, 0)),
                    isCompleted: args.isCompleted,
                    userID: args.userID
                })
                return todo.save()
            }
        },
        updateUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                firstName: { type: GraphQLString },
                lastName: { type: GraphQLString },
                email: { type: GraphQLString },
                password: { type: GraphQLString },
            },
            resolve(parent, args) {
                return User.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(args.id) }, {
                    firstName: args.firstName,
                    lastName: args.lastName,
                    email: args.email,
                    password: args.password
                });
            }
        },
        updateNote: {
            type: NoteType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                title: { type: GraphQLString },
                description: { type: GraphQLString },
                userID: { type: GraphQLID }
            },
            resolve(parent, args) {
                return Note.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(args.id) }, {
                    title: args.title,
                    description: args.description,
                    userID: args.userID
                });
            }
        },
        updateTodo: {
            type: TodoType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                title: { type: GraphQLString },
                forDate: { type: GraphQLDateTime },
                isCompleted: { type: GraphQLBoolean },
                userID: { type: GraphQLID }
            },
            resolve(parent, args) {
                return Todo.findByIdAndUpdate({ _id: mongoose.Types.ObjectId(args.id) }, {
                    title: args.title,
                    forDate: ars.forDate,
                    isCompleted: args.isCompleted,
                    userID: args.userID
                });
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve(parent, args) {
                return User.findByIdAndDelete({ _id: mongoose.Types.ObjectId(args.id) });
            }
        },
        deleteNote: {
            type: NoteType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve(parent, args) {
                return Note.findByIdAndDelete({ _id: mongoose.Types.ObjectId(args.id) });
            }
        },
        deleteTodo: {
            type: TodoType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve(parent, args) {
                return Todo.findByIdAndDelete({ _id: mongoose.Types.ObjectId(args.id) });
            }
        },
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});