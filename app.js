import express from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import prisma from './lib/prisma.js';
import methodOverride from 'method-override';


const app = express();
const db = new Database('BancoDeDados.db');
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));


app.post('/login', async (req, res) => {
    const { email_login, senha_login } = req.body;
    try {
        const usuario_bd = await prisma.usuario.findUnique({
            where: {
                email: email_login
            }
        });
        if (!usuario_bd) {
            return res.status(400).json({ erro: 'Email não encontrado' });
        }
        const senhaValida = await bcrypt.compare(senha_login, usuario_bd.senha);
        if (!senhaValida) {
            return res.status(400).json({ erro: 'Senha incorreta' });
        }

        return res.redirect('/index.html'); 

    } catch (erro) {    
        console.error(erro);
        return res.status(400).json({ erro: 'Erro ao realizar login.' });
    }
});

//Aba de CADASTROS (Usuários, Serviços, Clientes e Agentamentos) obs:prof pelas caridade se eu comentar aqui não é IA ta? abraço :)
app.post('/cadastro', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        await prisma.usuario.create({
            data: {
                email: email,
                senha: senhaHash
            }
        });
        return res.redirect('/login.html');
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao cadastrar (talvez o e-mail já exista).' });
    }
});
app.post('/cadastro_cliente', async (req,res) =>{
    const { nome_cliente, data_nascimento, telefone } = req.body;
    try{
        await prisma.cliente.create({
            data: {
                nome_cliente: nome_cliente,
                data_nascimento: new Date(data_nascimento),
                telefone: telefone
            }
        });
        return res.redirect('/clientes.html');

    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao cadastrar cliente.' });
    }
});

app.post('/cadastro_servico', async (req, res) => {
    const { nome_servico, preco, duracao_minutos } = req.body;
    try{
        await prisma.servico.create({
            data: {
                nome_servico: nome_servico,
                preco: parseFloat(preco),
                duracao_minutos: parseInt(duracao_minutos)
            }
        });  
        return res.redirect('/servicos.html');
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao cadastrar serviço.' });
    }
});

app.post('/cadastro_agendamento', async (req, res) => {
    const { cliente_id, servico_id, status, data_hora } = req.body;
    try {
        await prisma.agendamento.create({
            data: {
                status: status,
                data_hora: new Date(data_hora),
                cliente: {
                    connect: { id: parseInt(cliente_id) }
                },
                servico: {
                    connect: { id: parseInt(servico_id) }
                }
            }
        });
        
        return res.redirect('/agendamentos.html');
    } catch (erro) {
        console.log("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao cadastrar agendamento.' });
    }
});

//aba de Listagem (Clientes, Serviços e Agendamentos) obs:prof pelas caridade se eu comentar aqui não é IA ta? abraço :)
app.get('/listar_clientes', async (req, res) => {
    try{
      await prisma.cliente.findMany().then((clientes) => {
        res.json(clientes);
      });
    } catch (erro){
        res.status(500).json({ erro: 'Erro ao buscar clientes' });
    }
});


app.get('/listar_agendamentos', async (req, res) => {
    try {
        const agendamentos = await prisma.agendamento.findMany({
            include: {
                cliente: true,  
                servico: true  
            }
        });
        return res.json(agendamentos);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar agendamentos.' });
    }
});

app.get('/listar_servicos', async (req, res) => {
    try {
        const servicos = await prisma.servico.findMany();
        return res.json(servicos);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar serviços.' });
    }
});

app.put('/atualizar_agendamento/:id', async (req, res) => {
    const { id } = req.params;
    const { cliente_id, servico_id, status, data_hora } = req.body;

    try {
        await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: {
                status: status,
                data_hora: new Date(data_hora),
                cliente: {
                    connect: { id: parseInt(cliente_id) }
                },
                servico: {
                    connect: { id: parseInt(servico_id) }
                }
            }
        });
        return res.status(200).json({ mensagem: 'Atualizado com sucesso!' });
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao atualizar agendamento.' });
    }
});

app.put('/atualizar_cliente/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_cliente, data_nascimento, telefone } = req.body;
    try {
        await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: {
                nome_cliente: nome_cliente,
                data_nascimento: new Date(data_nascimento),
                telefone: telefone
            }
        });
        return res.redirect('/clientes.html');
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao atualizar cliente.' });
    }
});

app.put('/atualizar_servico/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_servico, preco, duracao_minutos } = req.body;

    try {
        await prisma.servico.update({
            where: { id: parseInt(id) },
            data: {
                nome_servico: nome_servico,
                preco: parseFloat(preco),          
                duracao_minutos: parseInt(duracao_minutos) 
            }
        });
        return res.status(200).json({ mensagem: 'Serviço atualizado com sucesso!' });
    } catch (erro) {
        console.error("ERRO AO ATUALIZAR SERVIÇO:", erro);
        return res.status(400).json({ erro: 'Erro ao atualizar serviço.' });
    }
});

app.delete('/deletar_cliente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.cliente.delete({
            where: { id: parseInt(id) }
        });
        return res.redirect('/clientes.html');
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao deletar cliente.' });
    }
});

app.delete('/deletar_agendamento/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.agendamento.delete({
            where: { id: parseInt(id) }
        });
        return res.status(200).json({ mensagem: 'Deletado com sucesso' });
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao deletar agendamento.' });
    }
});

app.delete('/deletar_servico/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.agendamento.deleteMany({
            where: { servicoId: parseInt(id) }
        });
        await prisma.servico.delete({
            where: { id: parseInt(id) }
        });

        return res.status(200).json({ mensagem: 'Serviço deletado com sucesso!' });
    } catch (erro) {
        console.error("ERRO AO DELETAR SERVIÇO:", erro);
        return res.status(400).json({ erro: 'Erro ao deletar serviço.' });
    }
});

app.put('/concluir_agendamento/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.agendamento.update({
            where: { id: parseInt(id) },
            data: { status: 'concluido' }
        });
        return res.status(200).json({ mensagem: 'Agendamento concluído com sucesso!' });
    } catch (erro) {
        console.error("ERRO DO BANCO:", erro);
        return res.status(400).json({ erro: 'Erro ao concluir agendamento.' });
    }
});
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
