import { Buffer } from 'buffer';
import mercadopago from 'mercadopago';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

type PayType = {
    transaction_amount: number;
    description: string;
    payment_method_id: string;
    payer: {
        email: string;
        first_name: string;
    },
};

mercadopago.configure({
    access_token: process.env.token as string
});

const gerarPagamento = async () => {
    try {

        const payment_data: PayType | any = {
            transaction_amount: 0.01, // preço do produto em reais ( R$ )
            description: 'Descrição do produto',
            payment_method_id: 'pix',
            payer: {
                email: 'cliente@gmail.com',
                first_name: 'Cliente',
            }
        };

        const data = await mercadopago.payment.create(payment_data);
        const base64_img = data.body.point_of_interaction.transaction_data.qr_code_base64;
        const buf = Buffer.from(base64_img, 'base64');

        fs.writeFile('qr_code.png', buf, (error) => { if (error) throw error });

        const chavePix = data.body.point_of_interaction.transaction_data.qr_code;

        console.log('Aguardando pagamento... \n Chave pix: ' + chavePix);

        let tentativas = 0;
        const interval = setInterval(async () => {
            
            tentativas++;

            const res = await mercadopago.payment.get(data.body.id);
            const pagamentoStatus = res.body.status;

            if (tentativas >= 8 || pagamentoStatus === 'approved') {
                clearInterval(interval);
            };

            if(pagamentoStatus === 'approved') {
                console.log('Pagamento feito!');
            };

            if (pagamentoStatus !== 'approved') {
                console.log('Aguardando pagamento...');
            };

        }, 30_000);

    } catch (error) {
        console.log(error);
    };
};

gerarPagamento();