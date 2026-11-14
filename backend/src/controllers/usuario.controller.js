const UsuarioCtel = {};

const Usuario = require('../models/Usuario');

UsuarioCtel.getUsuarios = async (req, res)=>{

    const usuarios = await Usuario.find();
    res.json(usuarios);
};
UsuarioCtel.createUsuarios = async (req, res)=>{

};
UsuarioCtel.getUsuarios = async (req, res)=>{

};
UsuarioCtel.getUsuarios = async (req, res)=>{

};
UsuarioCtel.getUsuarios = async (req, res)=>{

};