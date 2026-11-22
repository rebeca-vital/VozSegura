const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
        return res.status(401).json({
            mensagem: "Acesso não autorizado. Faça login."
        });
    }

    const token = cabecalho.split(" ")[1];

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = usuario;

        next();
    } catch (erro) {
        return res.status(401).json({
            mensagem: "Sessão inválida ou expirada. Faça login novamente."
        });
    }
}

function permitirPerfil(...perfis) {
    return (req, res, next) => {
        if (!perfis.includes(req.usuario.perfil)) {
            return res.status(403).json({
                mensagem: "Você não tem permissão para acessar esta área."
            });
        }

        next();
    };
}

module.exports = {
    autenticar,
    permitirPerfil
};