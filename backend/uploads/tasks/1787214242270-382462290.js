const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { exec } = require('child_process');

var axios = require('axios');
const app = express();
const mysql = require('mysql');
const MySQLEvents = require('@rodrigogs/mysql-events');
const ora = require('ora');
const json = require('json');
var moment = require('moment');
var ip = require('ip');
const zlib = require('zlib');
var count = 1;
const spinner = ora({
    text: 'ðŸ›¸',
    color: 'blue',
    spinner: 'dots2',
});

const new_conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'passw0rd',
    database: 'asterisk',
});

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'passw0rd',
    database: 'asterisk',
});
let clients = [];
searchdata();

function searchdata() {
    const current_datetime = moment().format('Y-MM-DD');
    var pre_date = moment().subtract(1, 'days').format('Y-MM-DD');
    let sql = 'SELECT phonikip_db.tbl_agnt_evnt.id,';
    sql += ' asterisk.ps_contacts.`status`, ';
    sql += ' asterisk.ps_contacts.status_des, ';
    sql += ' asterisk.ps_contacts.endpoint, ';
    sql += ' asterisk.ps_contacts.update_datetime,';
    sql += ' asterisk.ps_contacts.linkedid as cli_linkedid,';
    sql += ' phonikip_db.tbl_calls_evnt.outoacw_sec_count,';
    sql += ' phonikip_db.tbl_calls_evnt.acw_sec_count, ';
    sql += ' phonikip_db.tbl_calls_evnt.linkedid,';
    sql += ' phonikip_db.user_master.fname,';
    sql += ' phonikip_db.user_master.username, ';
    sql += " CONCAT(phonikip_db.user_master.fname, ' ', phonikip_db.user_master.lname) AS fullname, ";
    sql += ' phonikip_db.user_master.com_id,';
    sql +=
        "( SELECT tbl_calls_evnt.frm_caller_num FROM phonikip_db.tbl_calls_evnt WHERE  tbl_calls_evnt.linkedid = cli_linkedid AND tbl_calls_evnt.call_type = 'Inbound'  AND date = '" +
        current_datetime +
        "' limit 1) AS call_cli,";
    sql +=
        "( SELECT tbl_calls_evnt.to_caller_num FROM phonikip_db.tbl_calls_evnt WHERE  tbl_calls_evnt.linkedid = cli_linkedid AND tbl_calls_evnt.call_type = 'outbound' AND date = '" +
        current_datetime +
        "' limit 1) AS out_call_cli";
    sql += ' from phonikip_db.tbl_agnt_evnt';
    sql += ' LEFT JOIN asterisk.ps_contacts  ON asterisk.ps_contacts.endpoint = phonikip_db.tbl_agnt_evnt.agnt_sipid';
    sql +=
        " Left JOIN phonikip_db.tbl_calls_evnt ON asterisk.ps_contacts.update_datetime = phonikip_db.tbl_calls_evnt.hangup_datatime and phonikip_db.tbl_calls_evnt.date = '" +
        current_datetime +
        "' ";
    sql += ' JOIN phonikip_db.user_master ON tbl_agnt_evnt.agnt_userid = phonikip_db.user_master.id';
    sql += " where phonikip_db.tbl_agnt_evnt.agnt_event= 'Log Out Time' ";
    sql +=
        "  and  phonikip_db.tbl_agnt_evnt.evnt_min_count = '0' and phonikip_db.tbl_agnt_evnt.agnt_sipid != '0' and phonikip_db.tbl_agnt_evnt.date between '" +
        pre_date +
        "' and '" +
        current_datetime +
        "'";
    sql += ' Group by asterisk.ps_contacts.endpoint';

    let query = connection.query(sql, (err, result) => {
        var data_row = {};
        var data_arr = new Array();
        var data = new Array();
        if (err) throw err;
        var i = 0;
        Object.keys(result).forEach(function (key) {
            var row = result[key];
            var endpoint = result[key]['endpoint'];
            var status = result[key]['status'];
            var status_des = result[key]['status_des'];
            var firstname = result[key]['fname'];
            var username = result[key]['username'];
            var fullname = result[key]['fullname'];
            var truncatedfullname = result[key]['fullname'];

            if (truncatedfullname) {
                if (truncatedfullname.length > 15) {
                    truncatedfullname = truncatedfullname.substring(0, 15) + '...';
                }
            } else {
                truncatedfullname = '';
            }

            var datetime = result[key]['update_datetime'];
            var outoacw_sec_count = result[key]['outoacw_sec_count'];
            var cli_linkedid = result[key]['cli_linkedid'];
            var acw_sec_count = result[key]['acw_sec_count'];
            var call_cli = result[key]['call_cli'];
            var out_call_cli = result[key]['out_call_cli'];
            var com_id = result[key]['com_id'];

            var timestamp = new Date().getTime();

            data_row = JSON.stringify({
                endpoint: endpoint,
                status: status,
                status_des: status_des,
                firstname: firstname,
                username: username,
                fullname: fullname,
                truncatedfullname: truncatedfullname,
                datetime: datetime,
                outoacw_sec_count: outoacw_sec_count,
                cli_linkedid: cli_linkedid,
                acw_sec_count: acw_sec_count,
                call_cli: call_cli,
                timestamp: timestamp,
                out_call_cli: out_call_cli,
                com_id: com_id,
            });

            data_arr.push(data_row);
        });

        data[0] = data_arr;

        //---------------------- fetch data of summnery of the day -----------------------------
        const current_datetime = moment().format('Y-MM-DD');
        let sql_tiles = 'SELECT';
        sql_tiles += ' tbl_calls_evnt.id,';
        sql_tiles += ' queues_config.com_id AS company_id,';
        sql_tiles += ' tbl_calls_evnt.date AS currnt_date,';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS answer_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles +=
            " AND ( tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT' OR tbl_calls_evnt.DESC = 'CONNECT' ) AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS answer_calls, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' IFNULL(SUM( tbl_calls_evnt.ring_sec_count ),0) AS ans_waiting_time ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND ( tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT' ) ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' AND tbl_calls_evnt.ring_sec_count <= 10 ';
        sql_tiles += ' ) AS ans_waiting_time, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' IFNULL(SUM( tbl_calls_evnt.answer_sec_count ),0) AS show_answer_sec_count ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ANSWER' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS show_answer_sec_count, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' IFNULL(SUM( tbl_calls_evnt.acw_sec_count ),0) AS show_acw_sec_count ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ANSWER' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS show_acw_sec_count, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT(first_tbl.linkedid) AS answer_calls_sl ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt AS first_tbl';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON first_tbl.agnt_queueid = queues_config.extension ';
        sql_tiles +=
            ' INNER JOIN phonikip_db.tbl_calls_evnt AS second_tbl on first_tbl.linkedid = second_tbl.linkedid ';
        sql_tiles += ' AND second_tbl.answer_datetime is not null';
        sql_tiles += ' WHERE';
        sql_tiles += " first_tbl.`status` = 'ENTERQUEUE' ";
        sql_tiles +=
            " AND ( first_tbl.DESC = 'COMPLETECALLER' OR first_tbl.DESC = 'COMPLETEAGENT' OR first_tbl.DESC = 'CONNECT')";
        sql_tiles += ' AND first_tbl.date = currnt_date ';
        sql_tiles += ' AND TIMESTAMPDIFF(SECOND, first_tbl.cre_datetime,second_tbl.answer_datetime) < 21 ';
        sql_tiles += ' AND queues_config.com_id = company_id';
        sql_tiles += ' ) AS answer_calls_sl, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' SUM(TIMESTAMPDIFF(SECOND, first_tbl.cre_datetime,second_tbl.answer_datetime)) AS asa_sec_count ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt AS first_tbl';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON first_tbl.agnt_queueid = queues_config.extension ';
        sql_tiles +=
            ' INNER JOIN phonikip_db.tbl_calls_evnt AS second_tbl on first_tbl.linkedid = second_tbl.linkedid ';
        sql_tiles += ' AND second_tbl.answer_datetime is not null';
        sql_tiles += ' WHERE';
        sql_tiles += " first_tbl.`status` = 'ENTERQUEUE' ";
        sql_tiles +=
            " AND ( first_tbl.DESC = 'COMPLETECALLER' OR first_tbl.DESC = 'COMPLETEAGENT' OR first_tbl.DESC = 'CONNECT')";
        sql_tiles += ' AND first_tbl.date = currnt_date ';
        sql_tiles += ' AND queues_config.com_id = company_id';
        sql_tiles += ' ) AS asa_sec_count, (';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS offerd_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS offerd_calls, (';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_abn_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.DESC = 'ABANDON' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS tot_abn_calls,(';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS pure_abn_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.DESC = 'ABANDON' ";
        sql_tiles += ' AND tbl_calls_evnt.ring_sec_count > 15 ';
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS pure_abn_calls,(';


        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_abn_calls_21 ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.DESC = 'ABANDON' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' AND tbl_calls_evnt.ring_sec_count < 21 ';
        sql_tiles += ' ) AS tot_abn_calls_21,(';

       
        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_abn_calls_sl ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.DESC = 'ABANDON' ";
        sql_tiles += ' AND queues_config.com_id = company_id AND tbl_calls_evnt.ring_sec_count < 5';
        sql_tiles += ' ) AS tot_abn_calls_sl,(';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_clbk_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.DESC = 'EXITWITHKEY' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS tot_clbk_calls,(';
        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_connect_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' ";
        sql_tiles += " AND tbl_calls_evnt.DESC = 'CONNECT' ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS tot_connect_calls,(';
        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_pending_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' ";
        sql_tiles += " AND ( tbl_calls_evnt.DESC = 'RINGNOANSWER' OR tbl_calls_evnt.DESC is null ) ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS tot_pending_calls,(';
        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_cda_calls ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += ' tbl_calls_evnt.date = currnt_date ';
        sql_tiles += " AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' ";
        sql_tiles += " AND tbl_calls_evnt.DESC = 'COMPLETEAGENT'  ";
        sql_tiles += ' AND queues_config.com_id = company_id ';
        sql_tiles += ' ) AS tot_cda_calls,(';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT(queue) as tot_rate_calls';
        sql_tiles += ' FROM phonikip_db.tbl_call_rating';
        sql_tiles += ' WHERE';
        sql_tiles +=
            " tbl_call_rating.call_datetime between '" +
            current_datetime +
            " 00:00:00' and '" +
            current_datetime +
            " 23:00:00' ";
        sql_tiles += ' AND rate_num IN (1,2,3,4,5)';
        sql_tiles += ' ) AS tot_rate_calls,(';

        sql_tiles += ' SELECT';
        sql_tiles += ' COUNT(queue) as tot_tran_rate_calls';
        sql_tiles += ' FROM phonikip_db.tbl_call_rating';
        sql_tiles += ' WHERE';
        sql_tiles +=
            " tbl_call_rating.call_datetime between '" +
            current_datetime +
            " 00:00:00' and '" +
            current_datetime +
            " 23:00:00' ";
        sql_tiles += ' ) AS tot_tran_rate_calls,';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT( tbl_callback_mst.id ) AS tot_completed_callbk_req ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_callback_mst';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_callback_mst.queue = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += " DATE(tbl_callback_mst.datetime) = '" + current_datetime + "' ";
        sql_tiles +=
            ' AND (queues_config.com_id = company_id OR tbl_callback_mst.did IN (SELECT box_name from phonikip_db.tbl_srvbox_mst Where cat_id=2 and com_id=company_id)) ';
        sql_tiles += ' AND tbl_callback_mst.status = 1 ';
        sql_tiles += ' ) AS tot_completed_callbk_req, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT( tbl_callback_mst.id ) AS tot_pending_callbk_req ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_callback_mst';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_callback_mst.queue = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += " DATE(tbl_callback_mst.datetime) = '" + current_datetime + "' ";
        sql_tiles +=
            ' AND (queues_config.com_id = company_id OR tbl_callback_mst.did IN (SELECT box_name from phonikip_db.tbl_srvbox_mst Where cat_id=2 and com_id=company_id)) ';
        sql_tiles += ' AND tbl_callback_mst.status = 0 ';
        sql_tiles += ' ) AS tot_pending_callbk_req, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_pending_abancallbk ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += " tbl_calls_evnt.date = '" + current_datetime + "' ";
        sql_tiles += ' AND queues_config.com_id = company_id  ';
        sql_tiles += " AND tbl_calls_evnt.desc = 'ABANDON' ";
        sql_tiles += ' AND tbl_calls_evnt.ring_sec_count > 15 ';
        sql_tiles += ' AND tbl_calls_evnt.cbstatus = 0 ';
        sql_tiles += ' ) AS tot_pending_abancallbk, ';

        sql_tiles += ' ( SELECT';
        sql_tiles += ' COUNT( tbl_calls_evnt.id ) AS tot_completed_abancallbk ';
        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += " tbl_calls_evnt.date = '" + current_datetime + "' ";
        sql_tiles += ' AND queues_config.com_id = company_id  ';
        sql_tiles += " AND tbl_calls_evnt.desc = 'ABANDON' ";
        sql_tiles += ' AND tbl_calls_evnt.ring_sec_count > 15 ';
        sql_tiles += ' AND tbl_calls_evnt.cbstatus = 1 ';
        sql_tiles += ' ) AS tot_completed_abancallbk, ';

        sql_tiles += ' ( SELECT ROUND(( (pure_abn_calls ) / offerd_calls )* 100 , 2) AS tot_abn_rate ) AS tot_abn_rate, ';
       
        sql_tiles += ' ( SELECT ROUND( asa_sec_count / answer_calls  , 2) AS asa ) AS asa, ';
        sql_tiles +=
            " ( SELECT TIME_FORMAT(SEC_TO_TIME(ROUND(( show_answer_sec_count + show_acw_sec_count) / answer_calls  , 2)), '%i:%s') AS aht ) AS aht, ";
        sql_tiles +=
            " ( SELECT TIME_FORMAT(SEC_TO_TIME(ROUND((show_acw_sec_count) / answer_calls  , 2)), '%i:%s') AS acw ) AS acw, ";
       sql_tiles += ' ( SELECT ROUND(( ((tot_abn_calls - pure_abn_calls) + answer_calls  )/ offerd_calls)*100 , 2) AS asr ) AS asr, ';
      
       sql_tiles += ' ( SELECT ROUND((( answer_calls_sl+tot_abn_calls_21) / offerd_calls)*100 , 2) AS sl ) AS sl, ';
       
        sql_tiles +=
            ' ( SELECT ROUND(( answer_calls_sl / (offerd_calls-tot_abn_calls_sl-tot_clbk_calls) )* 100 , 2) AS tot_sl_rate ) AS tot_sl_rate, ';

        sql_tiles +=
            " ( SELECT COUNT(p.endpoint) FROM asterisk.ps_contacts p JOIN phonikip_db.tbl_agent_group a ON p.endpoint=a.sip_id INNER JOIN phonikip_db.user_master u ON u.id=p.userid WHERE a.group='horana' ) AS agent_count_horana, ";
        sql_tiles +=
            " ( SELECT COUNT(p.endpoint) FROM asterisk.ps_contacts p JOIN phonikip_db.tbl_agent_group a ON p.endpoint=a.sip_id  INNER JOIN phonikip_db.user_master u ON u.id=p.userid WHERE a.group='kohuwala' ) AS agent_count_kohuwala, ";
        sql_tiles += ' ( SELECT COUNT(p.endpoint) FROM asterisk.ps_contacts p ) AS tot_agent_count ';

        sql_tiles += ' FROM';
        sql_tiles += ' phonikip_db.tbl_calls_evnt';
        sql_tiles += ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid = queues_config.extension ';
        sql_tiles += ' WHERE';
        sql_tiles += " tbl_calls_evnt.date = '" + current_datetime + "' ";
        sql_tiles += ' GROUP BY';
        sql_tiles += ' queues_config.com_id';

        let query = connection.query(sql_tiles, (err, result_tiles) => {
            var data_summery = {};
            var data_arr_sum = new Array();
            if (err) throw err;
            var i = 0;
            Object.keys(result_tiles).forEach(function (key) {
                var row = result_tiles[key];
                var offerd_calls = result_tiles[key]['offerd_calls'];
                var answer_calls = result_tiles[key]['answer_calls'];
                var tot_abn_calls = result_tiles[key]['tot_abn_calls'];
                var pure_abn_calls = result_tiles[key]['pure_abn_calls'];

                var tot_connect_calls = result_tiles[key]['tot_connect_calls'];
                var tot_pending_calls = result_tiles[key]['tot_pending_calls'];
                var tot_abn_rate = result_tiles[key]['tot_abn_rate'];
                var asr = result_tiles[key]['asr'];
                var asa = result_tiles[key]['asa'];
                var sl = result_tiles[key]['sl'];
                var aht = result_tiles[key]['aht'];
                var acw = result_tiles[key]['acw'];
                var company_id = result_tiles[key]['company_id'];
                var tot_ob_calls = result_tiles[key]['tot_ob_calls'];
                var tot_ob_ans_calls = result_tiles[key]['tot_ob_ans_calls'];
                var tot_cda_calls = result_tiles[key]['tot_cda_calls'];
                var tot_clbk_calls = result_tiles[key]['tot_clbk_calls'];
                var tot_rate_calls = result_tiles[key]['tot_rate_calls'];
                var tot_tran_rate_calls = result_tiles[key]['tot_tran_rate_calls'];
                var tot_sl_rate = result_tiles[key]['tot_sl_rate'];

                var tot_completed_callbk_req = result_tiles[key]['tot_completed_callbk_req'];
                var tot_pending_callbk_req = result_tiles[key]['tot_pending_callbk_req'];
                var tot_pending_abancallbk = result_tiles[key]['tot_pending_abancallbk'];
                var tot_completed_abancallbk = result_tiles[key]['tot_completed_abancallbk'];

                var agent_count_horana = result_tiles[key]['agent_count_horana'];
                var agent_count_kohuwala = result_tiles[key]['agent_count_kohuwala'];
                var tot_agent_count = result_tiles[key]['tot_agent_count'];

                data_summery = JSON.stringify({
                    offerd_calls: offerd_calls,
                    answer_calls: answer_calls,
                    tot_abn_calls: tot_abn_calls,
                    pure_abn_calls: pure_abn_calls,

                    tot_connect_calls: tot_connect_calls,
                    tot_pending_calls: tot_pending_calls,
                    tot_abn_rate: tot_abn_rate,
                    asa: asa,
                    asr: asr,
                    sl: sl,
                    aht: aht,
                    acw: acw,
                    tot_ob_calls: tot_ob_calls,
                    tot_ob_ans_calls: tot_ob_ans_calls,
                    tot_cda_calls: tot_cda_calls,
                    tot_clbk_calls: tot_clbk_calls,
                    tot_rate_calls: tot_rate_calls,
                    tot_tran_rate_calls: tot_tran_rate_calls,
                    tot_sl_rate: tot_sl_rate,

                    tot_completed_callbk_req: tot_completed_callbk_req,
                    tot_pending_callbk_req: tot_pending_callbk_req,
                    tot_pending_abancallbk: tot_pending_abancallbk,
                    tot_completed_abancallbk: tot_completed_abancallbk,

                    agent_count_horana: agent_count_horana,
                    agent_count_kohuwala: agent_count_kohuwala,
                    tot_agent_count: tot_agent_count,

                    com_id: company_id,
                });

                data_arr_sum.push(data_summery);
            });

            data[1] = data_arr_sum;

            //---------------------- fetch data of outbound calls -----------------------------
            const current_datetime = moment().format('Y-MM-DD');
            let sql_outbound = 'SELECT user_master.com_id AS company_id,';
            sql_outbound += ' tbl_calls_evnt.date AS currnt_date,';
            sql_outbound += ' COUNT( tbl_calls_evnt.id ) AS tot_ob_calls,';
            sql_outbound += ' (SELECT COUNT( tbl_calls_evnt.id ) AS tot_ob_ans_calls';
            sql_outbound += ' FROM phonikip_db.tbl_calls_evnt ';
            sql_outbound += ' INNER JOIN phonikip_db.user_master ON tbl_calls_evnt.agnt_userid= user_master.id';
            sql_outbound += ' WHERE tbl_calls_evnt.date = currnt_date ';
            sql_outbound += " AND tbl_calls_evnt.call_type= 'outbound' ";
            sql_outbound += " AND user_master.com_id = company_id  AND tbl_calls_evnt.status= 'ANSWER'";
            sql_outbound += ' ) AS tot_ob_ans_calls FROM';
            sql_outbound += ' phonikip_db.tbl_calls_evnt ';
            sql_outbound += ' INNER JOIN phonikip_db.user_master ON tbl_calls_evnt.agnt_userid= user_master.id';
            sql_outbound += ' WHERE';
            sql_outbound +=
                " tbl_calls_evnt.date = '" + current_datetime + "' AND tbl_calls_evnt.call_type= 'outbound' ";
            sql_outbound += ' GROUP BY';
            sql_outbound += ' user_master.com_id';

            query_outbound = connection.query(sql_outbound, (err, result_outbound) => {
                var data_outbound = {};
                var data_arr_outbound = new Array();
                if (err) throw err;
                var i = 0;
                Object.keys(result_outbound).forEach(function (key) {
                    var row = result_outbound[key];
                    var tot_ob_calls = result_outbound[key]['tot_ob_calls'];
                    var tot_ob_ans_calls = result_outbound[key]['tot_ob_ans_calls'];
                    var com_id = result_outbound[key]['company_id'];

                    data_outbound = JSON.stringify({
                        tot_ob_calls: tot_ob_calls,
                        tot_ob_ans_calls: tot_ob_ans_calls,
                        com_id: com_id,
                    });

                    data_arr_outbound.push(data_outbound);
                });

                data[2] = data_arr_outbound;
            });
            //---------------------- fetch data of Queue summery -----------------------------

            let sql_queue = 'SELECT asterisk.queues_config.extension as queue_id,';
            sql_queue += 'asterisk.queues_config.descr as description, ';
            sql_queue += 'asterisk.queues_config.com_id, ';
            sql_queue += "(SELECT CONCAT_WS('-', queue_id, description) as queue_name)as queue_name, ";
            sql_queue +=
                "( SELECT  COUNT( tbl_calls_evnt.id ) AS tot_connect_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.date = '" +
                current_datetime +
                "' and tbl_calls_evnt.agnt_queueid = queue_id ";
            sql_queue +=
                "AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.DESC = 'CONNECT' ) AS tot_connect_calls,";
            sql_queue +=
                "( SELECT COUNT( tbl_calls_evnt.id ) AS tot_pending_calls FROM  phonikip_db.tbl_calls_evnt  WHERE  tbl_calls_evnt.date = '" +
                current_datetime +
                "' and tbl_calls_evnt.agnt_queueid = queue_id ";
            sql_queue +=
                "AND tbl_calls_evnt.STATUS = 'ENTERQUEUE'  AND (tbl_calls_evnt.DESC = 'RINGNOANSWER' or tbl_calls_evnt.DESC is null) ) AS tot_pending_calls,";
            sql_queue +=
                '(select ROUND((tot_pending_calls + tot_connect_calls)) as tot_queue_calls )as tot_queue_calls ';
            sql_queue += 'FROM asterisk.queues_config ';

            let query = connection.query(sql_queue, (err, result_queue) => {
                var data_queue = {};
                var data_arr_qu = new Array();
                if (err) throw err;
                var i = 0;
                Object.keys(result_queue).forEach(function (key) {
                    var row = result_queue[key];
                    var queue_name = result_queue[key]['queue_name'];
                    var tot_connect_calls = result_queue[key]['tot_connect_calls'];
                    var tot_pending_calls = result_queue[key]['tot_pending_calls'];
                    var tot_queue_calls = result_queue[key]['tot_queue_calls'];
                    var com_id = result_queue[key]['com_id'];

                    data_queue = JSON.stringify({
                        queue_name: queue_name,
                        tot_connect_calls: tot_connect_calls,
                        tot_pending_calls: tot_pending_calls,
                        tot_queue_calls: tot_queue_calls,
                        com_id: com_id,
                    });

                    data_arr_qu.push(data_queue);
                });

                data[3] = data_arr_qu;
            });

            //---------------------- fetch data of Srv Module -----------------------------

            let sql_srv = 'SELECT tbl_com_mst.id AS company_id,';
            sql_srv += ' tbl_com_mst.com_name,';

            sql_srv += ' (SELECT Count(tbl_emlsrv_receive.id) as tot_eml_count FROM phonikip_db.tbl_emlsrv_receive';
            sql_srv +=
                " where tbl_emlsrv_receive.`com_id` = company_id and status IN ('Closed','Complete','Discard') and tbl_emlsrv_receive.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_eml_count,";

            sql_srv += ' (SELECT Count(tbl_emlsrv_receive.id) as fsh_eml_count FROM phonikip_db.tbl_emlsrv_receive';
            sql_srv +=
                " where tbl_emlsrv_receive.`com_id` = company_id  and tbl_emlsrv_receive.`status` = 'FRESH') AS fsh_eml_count,";

            sql_srv += ' (SELECT Count(tbl_srvwac_mst.id) as tot_wac_count FROM phonikip_db.tbl_srvwac_mst ';
            sql_srv +=
                " where w_Status IN ('Closed','Discard') and tbl_srvwac_mst.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_wac_count,";

            sql_srv += ' (SELECT Count(tbl_srvwac_mst.id) as fsh_wac_count FROM phonikip_db.tbl_srvwac_mst';
            sql_srv +=
                " where tbl_srvwac_mst.`com_id` = company_id  and tbl_srvwac_mst.`w_Status` = 'Fresh') AS fsh_wac_count,";

            sql_srv += ' (SELECT Count(tbl_faxsrv_receive.id) as tot_fax_count FROM phonikip_db.tbl_faxsrv_receive';
            sql_srv +=
                " where status IN ('Closed','Discard') and tbl_faxsrv_receive.`com_id` = company_id and tbl_faxsrv_receive.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_fax_count,";

            sql_srv += ' (SELECT Count(tbl_faxsrv_receive.id) as fsh_fax_count FROM phonikip_db.tbl_faxsrv_receive';
            sql_srv +=
                " where tbl_faxsrv_receive.`com_id` = company_id  and tbl_faxsrv_receive.`status` IN  ('Fresh','Pending') ) AS fsh_fax_count,";

            sql_srv += ' (SELECT Count(tbl_srvchat_mst.id) as tot_webc_count FROM phonikip_db.tbl_srvchat_mst';
            sql_srv +=
                " where chat_Status IN ('Closed','Complete','Discard') and tbl_srvchat_mst.`com_id` = company_id and tbl_srvchat_mst.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_webc_count,";

            sql_srv += ' (SELECT Count(tbl_srvchat_mst.id) as fsh_webc_count FROM phonikip_db.tbl_srvchat_mst';
            sql_srv +=
                " where tbl_srvchat_mst.`com_id` = company_id  and tbl_srvchat_mst.`chat_Status` = 'Fresh') AS fsh_webc_count,";

            sql_srv += ' (SELECT Count(tbl_smssrv_receive.id) as tot_sms_count FROM phonikip_db.tbl_smssrv_receive';
            sql_srv +=
                " where status IN ('Discard','Closed') and tbl_smssrv_receive.`com_id` = company_id and tbl_smssrv_receive.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_sms_count,";

            sql_srv += ' (SELECT Count(tbl_smssrv_receive.id) as fsh_sms_count FROM phonikip_db.tbl_smssrv_receive';
            sql_srv +=
                " where tbl_smssrv_receive.`com_id` = company_id  and tbl_smssrv_receive.`status` = 'Fresh') AS fsh_sms_count,";

            sql_srv +=
                ' (SELECT Count(tbl_srvmessenger_mst.id) as tot_messenger_count FROM phonikip_db.tbl_srvmessenger_mst';
            sql_srv +=
                " where fb_Status IN ('Discard','Complete','Closed') AND tbl_srvmessenger_mst.`com_id` = company_id and tbl_srvmessenger_mst.cre_datetime BETWEEN '" +
                current_datetime +
                " 00:00:00' and '" +
                current_datetime +
                " 23:00:00') AS tot_messenger_count,";

            sql_srv +=
                ' (SELECT Count(tbl_srvmessenger_mst.id) as fsh_messenger_count FROM phonikip_db.tbl_srvmessenger_mst';
            sql_srv +=
                " where tbl_srvmessenger_mst.`com_id` = company_id  and tbl_srvmessenger_mst.`fb_status` = 'Fresh') AS fsh_messenger_count";

            sql_srv += ' FROM phonikip_db.tbl_com_mst GROUP BY tbl_com_mst.id';

            let query_srv = connection.query(sql_srv, (err, result_srv) => {
                var data_srv = {};
                var data_arr_srv = new Array();
                if (err) throw err;
                var i = 0;

                Object.keys(result_srv).forEach(function (key) {
                    var row = result_srv[key];
                    var tot_eml_count = result_srv[key]['tot_eml_count'];
                    var fsh_eml_count = result_srv[key]['fsh_eml_count'];
                    var tot_fax_count = result_srv[key]['tot_fax_count'];
                    var fsh_fax_count = result_srv[key]['fsh_fax_count'];
                    var tot_sms_count = result_srv[key]['tot_sms_count'];
                    var fsh_sms_count = result_srv[key]['fsh_sms_count'];
                    var tot_wac_count = result_srv[key]['tot_wac_count'];
                    var fsh_wac_count = result_srv[key]['fsh_wac_count'];
                    var tot_webc_count = result_srv[key]['tot_webc_count'];
                    var fsh_webc_count = result_srv[key]['fsh_webc_count'];
                    var tot_messenger_count = result_srv[key]['tot_messenger_count'];
                    var fsh_messenger_count = result_srv[key]['fsh_messenger_count'];
                    var com_id = result_srv[key]['company_id'];

                    data_srv = JSON.stringify({
                        tot_eml_count: tot_eml_count,
                        fsh_eml_count: fsh_eml_count,
                        tot_fax_count: tot_fax_count,
                        fsh_fax_count: fsh_fax_count,
                        tot_sms_count: tot_sms_count,
                        fsh_sms_count: fsh_sms_count,
                        tot_wac_count: tot_wac_count,
                        fsh_wac_count: fsh_wac_count,
                        tot_webc_count: tot_webc_count,
                        fsh_webc_count: fsh_webc_count,
                        tot_messenger_count: tot_messenger_count,
                        fsh_messenger_count: fsh_messenger_count,
                        com_id: com_id,
                    });

                    data_arr_srv.push(data_srv);
                });

                data[4] = data_arr_srv;

                //---------------------- fetch data of Queue status -----------------------------

                let sql_queue_status = "SELECT CASE WHEN tbl_calls_evnt.DESC = 'CONNECT' THEN 'CONNECT'";
                sql_queue_status += " WHEN tbl_calls_evnt.DESC  = 'RINGNOANSWER' THEN 'PENDING'";
                sql_queue_status += " WHEN tbl_calls_evnt.DESC  is null THEN 'PENDING'";
                sql_queue_status += ' END AS call_status,';
                sql_queue_status += ' tbl_calls_evnt.frm_caller_num,';
                sql_queue_status += ' tbl_calls_evnt.agnt_queueid,';
                sql_queue_status += ' tbl_calls_evnt.linkedid as call_linkedid,';
                sql_queue_status += ' tbl_calls_evnt.uniqueid as call_uniqueid,';
                sql_queue_status += ' tbl_calls_evnt.cre_datetime,';
                sql_queue_status += ' asterisk.queues_config.com_id, ';
                sql_queue_status += " CONCAT(queues_config.extension, '-', queues_config.descr) as queue_name, ";
                sql_queue_status += ' (SELECT user_master.username FROM phonikip_db.tbl_calls_evnt';
                sql_queue_status +=
                    ' INNER JOIN phonikip_db.user_master ON tbl_calls_evnt.agnt_userid = user_master.id';
                sql_queue_status +=
                    " WHERE tbl_calls_evnt.uniqueid = call_uniqueid and tbl_calls_evnt.status = 'ANSWER' limit 1) as username";
                sql_queue_status += ' FROM phonikip_db.tbl_calls_evnt ';
                sql_queue_status += ' LEFT JOIN phonikip_db.user_master ON tbl_calls_evnt.agnt_userid = user_master.id';
                sql_queue_status +=
                    ' INNER JOIN asterisk.queues_config ON tbl_calls_evnt.agnt_queueid= queues_config.extension';
                sql_queue_status += " WHERE tbl_calls_evnt.date = '" + current_datetime + "'";
                sql_queue_status +=
                    " AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND ( tbl_calls_evnt.DESC = 'CONNECT' or tbl_calls_evnt.DESC = 'RINGNOANSWER' or tbl_calls_evnt.DESC is null)";
                sql_queue_status += ' ORDER BY tbl_calls_evnt.DESC ASC,tbl_calls_evnt.cre_datetime ASC ';

                let query = connection.query(sql_queue_status, (err, result_queue_status) => {
                    var data_queue_status = {};
                    var data_arr_qu_st = new Array();
                    if (err) throw err;
                    var i = 0;
                    Object.keys(result_queue_status).forEach(function (key) {
                        // console.log(result_tiles);
                        var row = result_queue_status[key];
                        var frm_caller_num = result_queue_status[key]['frm_caller_num'];
                        var queue_name = result_queue_status[key]['queue_name'];
                        var call_status = result_queue_status[key]['call_status'];
                        var cre_datetime = result_queue_status[key]['cre_datetime'];
                        var username = result_queue_status[key]['username'];

                        if (username) {
                            if (username.length > 20) {
                                username = username.substring(0, 20) + '...';
                            }
                        } else {
                            username = '';
                        }

                        var com_id = result_queue_status[key]['com_id'];
                        var timestamp = new Date().getTime();

                        data_queue_status = JSON.stringify({
                            frm_caller_num: frm_caller_num,
                            call_status: call_status,
                            queue_name: queue_name,
                            cre_datetime: cre_datetime,
                            username: username,
                            com_id: com_id,
                            timestamp: timestamp,
                        });

                        data_arr_qu_st.push(data_queue_status);
                    });

                    data[5] = data_arr_qu_st;

                    //---------------------- live queue data-----------------------------

                    let sql_live_status = 'SELECT';
                    sql_live_status += ' descr AS `Queue_Name`,';
                    sql_live_status += ' com_id AS `com_id`,';
                    sql_live_status += " (SELECT CONCAT('Local/', ps.extension, '@from-queue/n,0')) AS sip_num_str,";
                    sql_live_status += ' COUNT(qd.id) AS `Allocated_agents`,';
                    sql_live_status +=
                        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension) AS `Agents_Logged`,";
                    sql_live_status +=
                        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension AND status = 'Online') AS `Agents_Free`,";
                    sql_live_status +=
                        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension AND status = 'In Call') AS `Agents_Occupied`,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS offerd_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS offerd_calls,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS answer_calls,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS tot_abn_calls,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_call_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'x') AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS answer_call_sl,";
                    sql_live_status +=
                        "( SELECT COUNT( tbl_calls_evnt.id ) AS connected_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.date = '" +
                        current_datetime +
                        "' and tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.DESC = 'CONNECT' ) AS connected_calls,";
                    sql_live_status +=
                        "( SELECT COUNT( tbl_calls_evnt.id ) AS pending_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.date = '" +
                        current_datetime +
                        "' and tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.STATUS = 'ENTERQUEUE'  AND (tbl_calls_evnt.DESC = 'RINGNOANSWER' or tbl_calls_evnt.DESC is null) ) AS pending_calls,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'y') AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS tot_abn_calls_sl,";
                    sql_live_status +=
                        " (SELECT COUNT(tbl_calls_evnt.id) AS q_breakout_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.desc = 'EXITWITHKEY' AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS q_breakout_calls,";
                    sql_live_status +=
                        " (SELECT SUM(tbl_calls_evnt.answer_sec_count) AS handling_time FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = qc.extension AND tbl_calls_evnt.STATUS = 'ANSWER' AND tbl_calls_evnt.`date` = '" +
                        current_datetime +
                        "') AS handling_time,";
                    sql_live_status +=
                        ' (SELECT ROUND((answer_call_sl / (offerd_calls - tot_abn_calls_sl - q_breakout_calls)) * 100, 2)) AS SLA,';
                    sql_live_status += ' (SELECT ROUND((tot_abn_calls / offerd_calls) * 100, 2)) AS AbanRate,';
                    sql_live_status += ' (SELECT SEC_TO_TIME(ROUND((handling_time / offerd_calls), 0))) AS AHT';
                    sql_live_status += ' FROM asterisk.queues_config qc';
                    sql_live_status += ' LEFT JOIN asterisk.queues_details qd ON qc.extension = qd.id';
                    sql_live_status +=
                        " LEFT JOIN asterisk.users ps ON qd.data = CONCAT('Local/', ps.extension, '@from-queue/n,0')";
                    sql_live_status += " WHERE qd.keyword = 'member' GROUP BY qc.extension";

                    let query = connection.query(sql_live_status, (err, result_live_status) => {
                        var data_live_status = {};
                        var data_arr_lv_st = new Array();
                        if (err) throw err;
                        var i = 0;
                        Object.keys(result_live_status).forEach(function (key) {
                            var row = result_live_status[key];
                            var Queue_Name = result_live_status[key]['Queue_Name'];
                            var Allocated_agents = result_live_status[key]['Allocated_agents'];
                            var Agents_Logged = result_live_status[key]['Agents_Logged'];
                            var Agents_Free = result_live_status[key]['Agents_Free'];
                            var Agents_Occupied = result_live_status[key]['Agents_Occupied'];
                            var offerd_calls = result_live_status[key]['offerd_calls'];
                            var answer_calls = result_live_status[key]['answer_calls'];
                            var connected_calls = result_live_status[key]['connected_calls'];
                            var pending_calls = result_live_status[key]['pending_calls'];
                            var tot_abn_calls = result_live_status[key]['tot_abn_calls'];
                            var SLA = result_live_status[key]['SLA'];
                            var AbanRate = result_live_status[key]['AbanRate'];
                            var AHT = result_live_status[key]['AHT'];
                            var com_id = result_live_status[key]['com_id'];

                            data_live_status = JSON.stringify({
                                Queue_Name: Queue_Name,
                                Allocated_agents: Allocated_agents,
                                Agents_Logged: Agents_Logged,
                                Agents_Free: Agents_Free,
                                Agents_Occupied: Agents_Occupied,
                                offerd_calls: offerd_calls,
                                answer_calls: answer_calls,
                                connected_calls: connected_calls,
                                pending_calls: pending_calls,
                                tot_abn_calls: tot_abn_calls,
                                SLA: SLA,
                                AHT: AHT,
                                AbanRate: AbanRate,
                                com_id: com_id,
                            });

                            data_arr_lv_st.push(data_live_status);
                        });

                        data[6] = data_arr_lv_st;

                        const get_day = moment().isoWeekday();
                        const get_time = moment().format('HH:mm:ss');

                        let get_date = 'SELECT phonikip_db.tbl_holidays.id';
                        get_date += ' from phonikip_db.tbl_holidays';
                        get_date += " where phonikip_db.tbl_holidays.date= '" + current_datetime + "' ";

                        let date_query = connection.query(get_date, (err, result) => {
                            if (err) throw err;
                            let holiday = '';

                            if (result.length === 0) {
                                holiday = '';
                            } else {
                                holiday = result[0]['id'];
                            }

                            if (holiday) {
                                day = 'Holiday';
                            } else if (get_day === 6 || get_day === 7) {
                                day = 'Weekend';
                            } else {
                                day = 'Weekday';
                            }

                            let agent_count =
                                'SELECT phonikip_db.tbl_roster_allocation.agent_count, phonikip_db.tbl_roster_allocation.com_id';
                            agent_count += ' from phonikip_db.tbl_roster_allocation';
                            agent_count += " where phonikip_db.tbl_roster_allocation.day= '" + day + "' ";
                            agent_count += " and phonikip_db.tbl_roster_allocation.to > '" + get_time + "' ";
                            agent_count += " and phonikip_db.tbl_roster_allocation.from < '" + get_time + "' ";

                            let date_query = connection.query(agent_count, (err, result) => {
                                if (err) throw err;

                                let agent_count = '';
                                let agent_comid = '';

                                if (result.length === 0) {
                                    agent_count = 0;
                                    agent_comid = '';
                                } else {
                                    agent_count = result[0]['agent_count'];
                                    agent_comid = result[0]['com_id'];
                                }

                                var data_agent_count = {};
                                var data_agent_arr = new Array();

                                data_agent_count = JSON.stringify({
                                    agent_count: agent_count,
                                    com_id: agent_comid,
                                });
                                data_agent_arr.push(data_agent_count);
                                data[7] = data_agent_arr;

                                //---------------------- live hotline data-----------------------------

                                let sql_live_hotline = 'SELECT';
                                sql_live_hotline += ' tbl_calls_evnt.did_num AS hotline_id,';
                                sql_live_hotline += ' queues_config.com_id AS com_id,';
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS offerd_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS offerd_calls,";
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS answer_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS answer_calls,";
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS tot_abn_calls,";
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS answer_call_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'x') AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS answer_call_sl,";
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'y') AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS tot_abn_calls_sl,";
                                sql_live_hotline +=
                                    " (SELECT COUNT(tbl_calls_evnt.id) AS q_breakout_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.desc = 'EXITWITHKEY' AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS q_breakout_calls,";
                                sql_live_hotline +=
                                    " (SELECT SUM(tbl_calls_evnt.answer_sec_count) AS handling_time FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.STATUS = 'ANSWER' AND tbl_calls_evnt.`date` = '" +
                                    current_datetime +
                                    "') AS handling_time,";
                                sql_live_hotline +=
                                    ' (SELECT ROUND((answer_call_sl / (offerd_calls - tot_abn_calls_sl - q_breakout_calls)) * 100, 2)) AS SLA,';
                                sql_live_hotline +=
                                    ' (SELECT ROUND((tot_abn_calls / offerd_calls) * 100, 2)) AS AbanRate,';
                                sql_live_hotline +=
                                    ' (SELECT ROUND((answer_calls / offerd_calls) * 100, 2)) AS AnswerRate,';
                                sql_live_hotline +=
                                    " (SELECT TIME_FORMAT(SEC_TO_TIME(ROUND((handling_time) / answer_calls  , 2)), '%i:%s') AS AHT ) AS AHT";
                                sql_live_hotline += ' FROM phonikip_db.tbl_calls_evnt';
                                sql_live_hotline +=
                                    ' JOIN asterisk.queues_config ON queues_config.extension = tbl_calls_evnt.agnt_queueid';
                                sql_live_hotline +=
                                    ' WHERE tbl_calls_evnt.did_num IS NOT NULL GROUP BY tbl_calls_evnt.did_num';

                                let query = connection.query(sql_live_hotline, (err, result_live_hotline) => {
                                    var data_live_hotline = {};
                                    var data_arr_lv_ht = new Array();
                                    if (err) throw err;
                                    var i = 0;
                                    Object.keys(result_live_hotline).forEach(function (key) {
                                        var row = result_live_hotline[key];
                                        var hotline_id = result_live_hotline[key]['hotline_id'];
                                        var offerd_calls = result_live_hotline[key]['offerd_calls'];
                                        var answer_calls = result_live_hotline[key]['answer_calls'];
                                        var answer_call_sl = result_live_hotline[key]['answer_call_sl'];
                                        var tot_abn_calls_sl = result_live_hotline[key]['tot_abn_calls_sl'];
                                        var tot_abn_calls = result_live_hotline[key]['tot_abn_calls'];
                                        var SLA = result_live_hotline[key]['SLA'];
                                        var AbanRate = result_live_hotline[key]['AbanRate'];
                                        var AnswerRate = result_live_hotline[key]['AnswerRate'];
                                        var AHT = result_live_hotline[key]['AHT'];
                                        var com_id = result_live_hotline[key]['com_id'];

                                        data_live_hotline = JSON.stringify({
                                            hotline_id: hotline_id,
                                            offerd_calls: offerd_calls,
                                            answer_calls: answer_calls,
                                            answer_call_sl: answer_call_sl,
                                            tot_abn_calls_sl: tot_abn_calls_sl,
                                            tot_abn_calls: tot_abn_calls,
                                            SLA: SLA,
                                            AHT: AHT,
                                            AbanRate: AbanRate,
                                            AnswerRate: AnswerRate,
                                            com_id: com_id,
                                        });
                                        data_arr_lv_ht.push(data_live_hotline);
                                    });

                                    data[8] = data_arr_lv_ht;

                                    //---------------------- live hotline queue data-----------------------------//

                                    let sql_live_hotline_queue = 'SELECT';
                                    sql_live_hotline_queue += ' tbl_calls_evnt.did_num AS hotline_id,';
                                    sql_live_hotline_queue +=
                                        ' queues_config.descr AS queue_name, queues_config.extension AS queue_id,';
                                    sql_live_hotline_queue += ' queues_config.com_id AS com_id,';
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS offerd_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS offerd_calls,";
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS answer_calls,";
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS tot_abn_calls,";
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_call_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'x') AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS answer_call_sl,";
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'y') AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS tot_abn_calls_sl,";
                                    sql_live_hotline_queue +=
                                        " (SELECT COUNT(tbl_calls_evnt.id) AS q_breakout_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND tbl_calls_evnt.desc = 'EXITWITHKEY' AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS q_breakout_calls,";
                                    sql_live_hotline_queue +=
                                        " (SELECT SUM(tbl_calls_evnt.answer_sec_count) AS handling_time FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.did_num = hotline_id AND tbl_calls_evnt.agnt_queueid = queue_id AND tbl_calls_evnt.STATUS = 'ANSWER' AND tbl_calls_evnt.`date` = '" +
                                        current_datetime +
                                        "') AS handling_time,";
                                    sql_live_hotline_queue +=
                                        ' (SELECT ROUND((answer_call_sl / (offerd_calls - tot_abn_calls_sl - q_breakout_calls)) * 100, 2)) AS SLA,';
                                    sql_live_hotline_queue +=
                                        ' (SELECT ROUND((tot_abn_calls / offerd_calls) * 100, 2)) AS AbanRate,';
                                    sql_live_hotline_queue +=
                                        ' (SELECT ROUND((answer_calls / offerd_calls) * 100, 2)) AS AnswerRate,';
                                    sql_live_hotline_queue +=
                                        " (SELECT TIME_FORMAT(SEC_TO_TIME(ROUND((handling_time) / answer_calls  , 2)), '%i:%s') AS AHT ) AS AHT";
                                    sql_live_hotline_queue += ' FROM phonikip_db.tbl_calls_evnt';
                                    sql_live_hotline_queue +=
                                        ' JOIN asterisk.queues_config ON queues_config.extension = tbl_calls_evnt.agnt_queueid';
                                    sql_live_hotline_queue +=
                                        ' WHERE tbl_calls_evnt.did_num IS NOT NULL GROUP BY tbl_calls_evnt.did_num, queue_name';

                                    let query = connection.query(
                                        sql_live_hotline_queue,
                                        (err, result_live_hotline_queue) => {
                                            var data_live_hotline_queue = {};
                                            var data_arr_lv_ht_qu = new Array();
                                            if (err) throw err;
                                            var i = 0;
                                            Object.keys(result_live_hotline_queue).forEach(function (key) {
                                                var row = result_live_hotline_queue[key];
                                                var hotline_id = result_live_hotline_queue[key]['hotline_id'];
                                                var queue_name = result_live_hotline_queue[key]['queue_name'];
                                                var queue_id = result_live_hotline_queue[key]['queue_id'];
                                                var offerd_calls = result_live_hotline_queue[key]['offerd_calls'];
                                                var answer_calls = result_live_hotline_queue[key]['answer_calls'];
                                                var answer_call_sl = result_live_hotline_queue[key]['answer_call_sl'];
                                                var tot_abn_calls_sl =
                                                    result_live_hotline_queue[key]['tot_abn_calls_sl'];
                                                var tot_abn_calls = result_live_hotline_queue[key]['tot_abn_calls'];
                                                var SLA = result_live_hotline_queue[key]['SLA'];
                                                var AbanRate = result_live_hotline_queue[key]['AbanRate'];
                                                var AnswerRate = result_live_hotline_queue[key]['AnswerRate'];
                                                var AHT = result_live_hotline_queue[key]['AHT'];
                                                var com_id = result_live_hotline_queue[key]['com_id'];

                                                data_live_hotline_queue = JSON.stringify({
                                                    hotline_id: hotline_id,
                                                    queue_name: queue_name,
                                                    queue_id: queue_id,
                                                    offerd_calls: offerd_calls,
                                                    answer_calls: answer_calls,
                                                    answer_call_sl: answer_call_sl,
                                                    tot_abn_calls_sl: tot_abn_calls_sl,
                                                    tot_abn_calls: tot_abn_calls,
                                                    SLA: SLA,
                                                    AHT: AHT,
                                                    AbanRate: AbanRate,
                                                    AnswerRate: AnswerRate,
                                                    com_id: com_id,
                                                });

                                                data_arr_lv_ht_qu.push(data_live_hotline_queue);
                                            });

                                            data[9] = data_arr_lv_ht_qu;

                                            //---------------------- live pending data - sup console -----------------------------//

                                            const current_datetime = moment().format('Y-MM-DD');
                                            let sql_live_hotline_summary_sc = 'SELECT';
                                            sql_live_hotline_summary_sc += ' tbl_com_mst.id AS company_id,';
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS total_agents FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'Online' ) AS total_agents,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS total_online_agents FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'Online' ) AS total_online_agents,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS total_offline_agents FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'Offline' ) AS total_offline_agents,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS total_other_agents FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status != 'Offline') AS total_other_agents,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS outbound_agents FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'Outbound') AS outbound_agents,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS break_exceed FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status_des = 'Exceeded' ) AS break_exceed,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(asterisk.ps_contacts.endpoint) AS acw_status FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'ACW' ) AS acw_status,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(phonikip_db.tbl_login_approval.id) AS login_approval FROM phonikip_db.tbl_login_approval WHERE tbl_login_approval.status = 'Pending' ) AS login_approval,";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(phonikip_db.tbl_break_request.id) AS break_approval FROM phonikip_db.tbl_break_request WHERE tbl_break_request.sup_action = 'Fresh' ) AS break_approval,";
                                            sql_live_hotline_summary_sc +=
                                                ' (SELECT COUNT(endpoint) FROM asterisk.ps_contacts ) AS total_agents_count, ';
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(endpoint) FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'Break') AS break_agents, ";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(endpoint) FROM asterisk.ps_contacts WHERE asterisk.ps_contacts.status = 'ACW') AS acw_agents, ";
                                            sql_live_hotline_summary_sc +=
                                                " (SELECT COUNT(id) FROM phonikip_db.tbl_calls_evnt WHERE agent_cbstatus = '0' AND status = 'ANSWER' AND call_type = 'Inbound' AND date = '" +
                                                current_datetime +
                                                "') AS callback_requests ";
                                            sql_live_hotline_summary_sc += ' FROM phonikip_db.tbl_com_mst';

                                            let query = connection.query(
                                                sql_live_hotline_summary_sc,
                                                (err, result_live_hotline_summary_sc) => {
                                                    var data_live_hotline_summary_sc = {};
                                                    var data_arr_lv_ht_summary_sc = new Array();
                                                    if (err) throw err;
                                                    var i = 0;

                                                    Object.keys(result_live_hotline_summary_sc).forEach(function (key) {
                                                        var row = result_live_hotline_summary_sc[key];
                                                        var total_agents =
                                                            result_live_hotline_summary_sc[key]['total_agents'];
                                                        var total_online_agents =
                                                            result_live_hotline_summary_sc[key]['total_online_agents'];
                                                        var total_offline_agents =
                                                            result_live_hotline_summary_sc[key]['total_offline_agents'];
                                                        var total_other_agents =
                                                            result_live_hotline_summary_sc[key]['total_other_agents'];
                                                        var outbound_agents =
                                                            result_live_hotline_summary_sc[key]['outbound_agents'];
                                                        var break_exceed =
                                                            result_live_hotline_summary_sc[key]['break_exceed'];
                                                        var acw_status =
                                                            result_live_hotline_summary_sc[key]['acw_status'];
                                                        var login_approval =
                                                            result_live_hotline_summary_sc[key]['login_approval'];
                                                        var break_approval =
                                                            result_live_hotline_summary_sc[key]['break_approval'];

                                                        var total_agents_count =
                                                            result_live_hotline_summary_sc[key]['total_agents_count'];
                                                        var break_agents =
                                                            result_live_hotline_summary_sc[key]['break_agents'];
                                                        var acw_agents =
                                                            result_live_hotline_summary_sc[key]['acw_agents'];
                                                        var callback_requests =
                                                            result_live_hotline_summary_sc[key]['callback_requests'];
                                                        var com_id = result_live_hotline_summary_sc[key]['company_id'];

                                                        //console.log(outbound_agents);

                                                        data_live_hotline_summary_sc = JSON.stringify({
                                                            total_agents: total_agents,
                                                            total_online_agents: total_online_agents,
                                                            total_offline_agents: total_offline_agents,
                                                            total_other_agents: total_other_agents,
                                                            outbound_agents: outbound_agents,
                                                            break_exceed: break_exceed,
                                                            acw_status: acw_status,
                                                            login_approval: login_approval,
                                                            break_approval: break_approval,

                                                            total_agents_count: total_agents_count,
                                                            break_agents: break_agents,
                                                            acw_agents: acw_agents,
                                                            callback_requests: callback_requests,
                                                            com_id: com_id,
                                                        });
                                                        data_arr_lv_ht_summary_sc.push(data_live_hotline_summary_sc);
                                                    });

                                                    data[11] = data_arr_lv_ht_summary_sc;

                                                    var data_sent = JSON.stringify(data);
                                                    const compressedJson = zlib.gzipSync(data_sent);

                                                    var config = {
                                                        method: 'post',
                                                        url: 'http://' + ip.address() + ':3005/nest',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Content-Encoding': 'gzip',
                                                        },
                                                        data: compressedJson,
                                                    };

                                                    axios(config)
                                                        .then(function (response) {
                                                            setTimeout(() => {
                                                                searchdata();
                                                                console.log('----------------------------------------');
                                                                console.log('query success');
                                                            }, 2000);
                                                        })
                                                        .catch(function (error) {
                                                            console.log(error);
                                                            searchdata();
                                                            console.log('Errorrrrrrrrrrr');
                                                        });
                                                },
                                            );
                                        },
                                    );
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    console.log('agent login count : ' + clients.length);
}

function eventsHandler(req, res, next) {
    const headers = {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);

    const data = `data: ${JSON.stringify(nests)}\n\n`;

    res.write(data);

    var ip;
    if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(',')[0];
    } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
    } else {
        ip = req.ip;
    }
    console.log('client IP is *********************' + ip);
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res,
    };
    clients.push(newClient);

    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter((c) => c.id !== clientId);
    });
}

function sendEventsToAll(newNest) {
    clients.forEach((c) => c.res.write(`data: ${JSON.stringify(newNest)}\n\n`));
}

async function addNest(req, res, next) {
    const newNest = req.body;
    nests = newNest;

    res.json(newNest);

    return sendEventsToAll(newNest);
}

async function updateacw(req, res, next) {
    const { endpoint, status, cli_linkedid, outoacw_sec_count } = req.body;

    if (cli_linkedid != '' || cli_linkedid != 'undefined') {
        const update_datetime = moment().format('Y-M-D H:m:s');

        var sql =
            "UPDATE asterisk.ps_contacts SET status = 'Online' , update_datetime = '" +
            update_datetime +
            "', status_des = '', linkedid = '' WHERE endpoint =" +
            endpoint;

        new_conn.query(sql, function (err, result) {
            if (err) throw err;
        });

        var sql_02 =
            'UPDATE phonikip_db.tbl_calls_evnt SET acw_sec_count = ' +
            outoacw_sec_count +
            " , acwend_datatime = '" +
            update_datetime +
            "' WHERE linkedid ='" +
            cli_linkedid +
            "'";

        new_conn.query(sql_02, function (err, result_02) {
            if (err) throw err;
        });
    }
}

async function getUser(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var clientIP = req.body.clientIP;
    var path_url = req.body.path_url;

    var authentication = "SELECT password FROM phonikip_db.user_master WHERE user_master.username = '" + username + "'";

    new_conn.query(authentication, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var db_password = result[0].password;

            if (bcrypt.compareSync(password, db_password)) {
                var get_license =
                    'SELECT username, user_master.user_type_id, user_master.live_access, user_master.sup_console_access, tbl_com_mst.live_db_license';
                get_license +=
                    ' FROM phonikip_db.user_master join phonikip_db.tbl_com_mst on phonikip_db.user_master.com_id =  phonikip_db.tbl_com_mst.id  ';
                get_license += " WHERE user_master.username = '" + username + "' limit 1";

                new_conn.query(get_license, function (err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                        var live_db_license = '';
                        var username = '';
                        var live_access = '';
                        var sup_console_access = '';
                        Object.keys(result).forEach(function (key) {
                            var row = result[key];
                            live_db_license = row.live_db_license;
                            username = row.username;
                            live_access = row.live_access;
                            sup_console_access = row.sup_console_access;
                        });

                        if (path_url === 'sup_console' && sup_console_access === 'no') {
                            console.log('sup_accessdenied');

                            res.send({
                                login: 'user_accessdenied',
                            });
                        } else if (live_access === 'no') {
                            console.log('useraccessdenied');

                            res.send({
                                login: 'user_accessdenied',
                            });
                        } else if (username == 'Admin') {
                            var insert_log =
                                "INSERT INTO phonikip_db.tbl_live_db_log (username, event, description, datetime, ip_address) VALUES ('" +
                                username +
                                "', 'User Loged In', 'User Loged In', NOW(), '" +
                                clientIP +
                                "')";
                            new_conn.query(insert_log, function (err, result_insert) {
                                if (err) throw err;
                            });

                            res.send({
                                login: 'valid',
                            });
                        } else if (live_db_license <= clients.length) {
                            console.log('licenseexceeded');
                            var insert_log =
                                "INSERT INTO phonikip_db.tbl_live_db_log (username, event, description, datetime, ip_address) VALUES ('" +
                                username +
                                "', 'User Loged In', 'license exceeded', NOW(), '" +
                                clientIP +
                                "')";
                            new_conn.query(insert_log, function (err, result_insert) {
                                if (err) throw err;
                            });

                            res.send({
                                login: 'licenseexceeded',
                            });
                        } else {
                            var insert_log =
                                "INSERT INTO phonikip_db.tbl_live_db_log (username, event, description, datetime, ip_address) VALUES ('" +
                                username +
                                "', 'User Loged In', 'User Loged In', NOW(), '" +
                                clientIP +
                                "')";
                            new_conn.query(insert_log, function (err, result_insert) {
                                if (err) throw err;
                            });

                            res.send({
                                login: 'valid',
                            });
                        }
                    }
                });
            } else {
                res.send({
                    login: 'invalid',
                });
            }
        } else {
            res.send({
                login: 'invalid',
            });
        }
    });
}

async function getUserDetail(req, res, next) {
    var username = req.body.username;
    var endpoint = req.body.endpoint;
    var queue_condition = 'Local/' + endpoint + '@from-queue/n,0';

    var get_user =
        "SELECT agnt_userid FROM phonikip_db.tbl_agnt_evnt WHERE tbl_agnt_evnt.agnt_sipid = '" +
        endpoint +
        "' ORDER BY id DESC LIMIT 1";

    new_conn.query(get_user, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var user_id = result[0].agnt_userid;

            var get_user_detail = 'SELECT asterisk.ps_contacts.endpoint,';
            get_user_detail +=
                " (SELECT SEC_TO_TIME(SUM(evnt_min_count)) AS break_time FROM phonikip_db.tbl_agnt_evnt WHERE agnt_userid='" +
                user_id +
                "' AND date = CURDATE() AND evnt_min_count IS NOT NULL AND agnt_event LIKE '%Break%') AS break_time,";
            get_user_detail +=
                " (SELECT SEC_TO_TIME(ROUND(SUM(tbl_calls_evnt.answer_sec_count) - SUM(tbl_calls_hold_evnts.hold_sec_count))) AS talk_time FROM phonikip_db.tbl_calls_evnt INNER JOIN phonikip_db.tbl_calls_hold_evnts ON tbl_calls_evnt.linkedid = tbl_calls_hold_evnts.linkedid WHERE tbl_calls_evnt.status  = 'ANSWER' AND tbl_calls_evnt.date = CURDATE() AND tbl_calls_evnt.agnt_userid = '" +
                user_id +
                "') AS talk_time,";
            get_user_detail +=
                " (SELECT COUNT(id) AS out_calls FROM phonikip_db.tbl_calls_evnt WHERE call_type='outbound' AND agnt_userid='" +
                user_id +
                "' AND date = CURDATE() ) AS out_calls,";
            get_user_detail +=
                " (SELECT COUNT(id) AS inbound_calls FROM phonikip_db.tbl_calls_evnt WHERE agnt_userid='" +
                user_id +
                "' AND DATE(cre_datetime) = CURDATE() AND status = 'ANSWER' AND call_type = 'Inbound') AS inbound_calls,";
            get_user_detail +=
                " (SELECT ROUND(SUM(tbl_calls_evnt.answer_sec_count) - SUM(tbl_calls_hold_evnts.hold_sec_count)) AS inbound_sec_count FROM phonikip_db.tbl_calls_evnt INNER JOIN phonikip_db.tbl_calls_hold_evnts ON tbl_calls_evnt.linkedid = tbl_calls_hold_evnts.linkedid WHERE tbl_calls_evnt.status  = 'ANSWER' AND tbl_calls_evnt.date = CURDATE() AND tbl_calls_evnt.call_type  = 'Inbound' AND tbl_calls_evnt.agnt_userid = '" +
                user_id +
                "') AS inbound_sec_count,";
            get_user_detail +=
                " (SELECT SEC_TO_TIME(ROUND(SUM(tbl_calls_evnt.answer_sec_count) - SUM(tbl_calls_hold_evnts.hold_sec_count))) AS inbound_talk_time FROM phonikip_db.tbl_calls_evnt INNER JOIN phonikip_db.tbl_calls_hold_evnts ON tbl_calls_evnt.linkedid = tbl_calls_hold_evnts.linkedid WHERE tbl_calls_evnt.status  = 'ANSWER' AND tbl_calls_evnt.date = CURDATE() AND tbl_calls_evnt.call_type  = 'Inbound' AND tbl_calls_evnt.agnt_userid = '" +
                user_id +
                "') AS inbound_talk_time,";
            get_user_detail +=
                " (SELECT TIME_FORMAT(SEC_TO_TIME(ROUND((inbound_sec_count) / inbound_calls  , 2)), '%i:%s') AS avg_handle_time ) AS avg_handle_time,";
            get_user_detail +=
                " (SELECT frm_caller_num AS last_call FROM phonikip_db.tbl_calls_evnt WHERE call_type='Inbound' AND agnt_userid='" +
                user_id +
                "' ORDER BY id DESC LIMIT 1) AS last_call,";
            get_user_detail +=
                " (SELECT COUNT(id) AS agent_no_answer FROM phonikip_db.tbl_agent_ring_event WHERE status='RINGNOANSWER' AND agnt_userid='" +
                user_id +
                "' AND ringing_start = CONCAT(CURDATE(), '%')) AS agent_no_answer,";
            get_user_detail +=
                " (SELECT COUNT(id) AS agent_disconnected FROM phonikip_db.tbl_calls_evnt WHERE call_type='Inbound' AND agnt_userid='" +
                user_id +
                "' AND tbl_calls_evnt.desc = 'COMPLETEAGENT' AND date = CURDATE()) AS agent_disconnected,";
            get_user_detail +=
                " (SELECT GROUP_CONCAT(agnt_desc, ' ') AS agent_breaks FROM phonikip_db.tbl_agnt_evnt WHERE agnt_event='Break Start' AND agnt_userid='" +
                user_id +
                "' AND cre_datetime = CONCAT(CURDATE(), '%')) AS agent_breaks,";
            get_user_detail +=
                " (SELECT GROUP_CONCAT(descr, ' ') AS agent_queues FROM asterisk.queues_details JOIN asterisk.queues_config ON queues_details.id = queues_config.extension WHERE keyword ='member' AND data LIKE '%" +
                queue_condition +
                "%') AS agent_queues";
            get_user_detail += ' FROM asterisk.ps_contacts ';
            get_user_detail += " WHERE asterisk.ps_contacts.endpoint = '" + endpoint + "' ";

            new_conn.query(get_user_detail, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    var live_user_detail = new Array();

                    Object.keys(result).forEach(function (key) {
                        var row = result[key];

                        const live_user_detail = {
                            break_time: row.break_time,
                            talk_time: row.talk_time,
                            out_calls: row.out_calls,
                            inbound_calls: row.inbound_calls,
                            inbound_talk_time: row.inbound_talk_time,
                            avg_handle_time: row.avg_handle_time,
                            agent_queues: row.agent_queues,
                            agent_breaks: row.agent_breaks,
                            agent_disconnected: row.agent_disconnected,
                            last_call: row.last_call,
                            agent_no_answer: row.agent_no_answer,
                        };

                        res.send({
                            live_user_detail: live_user_detail,
                        });
                    });
                }
            });
        }
    });
}

async function getQueueDetail(req, res, next) {
    var queue_name = req.body.queue_name;
    var queue_id = req.body.queue_id;
    const current_datetime = moment().format('Y-MM-DD');

    var sql_live_status = 'SELECT';
    sql_live_status += ' descr AS `Queue_Name`,';
    sql_live_status += ' com_id AS `com_id`,';
    sql_live_status += " (SELECT CONCAT('Local/', ps.extension, '@from-queue/n,0')) AS sip_num_str,";
    sql_live_status += ' COUNT(qd.id) AS `Allocated_agents`,';
    sql_live_status +=
        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension) AS `Agents_Logged`,";
    sql_live_status +=
        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension AND status = 'Online') AS `Agents_Free`,";
    sql_live_status +=
        " (SELECT COUNT(DISTINCT q.data) FROM asterisk.ps_contacts p JOIN asterisk.queues_details q ON CONCAT('Local/', p.endpoint, '@from-queue/n,0') = q.data WHERE q.id = qc.extension AND status = 'In Call') AS `Agents_Occupied`,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS offerd_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS offerd_calls,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS answer_calls,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS tot_abn_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.DESC = 'ABANDON' AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS tot_abn_calls,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS answer_call_sl FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND (tbl_calls_evnt.DESC = 'COMPLETECALLER' OR tbl_calls_evnt.DESC = 'COMPLETEAGENT') AND tbl_calls_evnt.ring_sec_count < (SELECT data FROM `phonikip_db`.`func_data` WHERE type = 'x') AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS answer_call_sl,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS connected_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.date = '" +
        current_datetime +
        "' AND tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND tbl_calls_evnt.DESC = 'CONNECT') AS connected_calls,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS pending_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.date = '" +
        current_datetime +
        "' AND tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.STATUS = 'ENTERQUEUE' AND (tbl_calls_evnt.DESC = 'RINGNOANSWER' OR tbl_calls_evnt.DESC IS NULL)) AS pending_calls,";
    sql_live_status +=
        " (SELECT COUNT(tbl_calls_evnt.id) AS q_breakout_calls FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.desc = 'EXITWITHKEY' AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS q_breakout_calls,";
    sql_live_status +=
        " (SELECT SUM(tbl_calls_evnt.answer_sec_count) AS handling_time FROM phonikip_db.tbl_calls_evnt WHERE tbl_calls_evnt.agnt_queueid = '" +
        queue_id +
        "' AND tbl_calls_evnt.STATUS = 'ANSWER' AND tbl_calls_evnt.`date` = '" +
        current_datetime +
        "') AS handling_time,";
    sql_live_status += ' (SELECT ROUND((answer_call_sl / (offerd_calls - q_breakout_calls)) * 100, 2)) AS SLA,';
    sql_live_status += ' (SELECT ROUND((tot_abn_calls / answer_calls) * 100, 2)) AS AbanRate,';
    sql_live_status += ' (SELECT SEC_TO_TIME(ROUND((handling_time / offerd_calls), 0))) AS AHT,';
    sql_live_status +=
        " (SELECT GROUP_CONCAT(data, ' ') AS queue_agents FROM asterisk.queues_details WHERE keyword ='member' AND id = '" +
        queue_id +
        "') AS queue_agents";
    sql_live_status += ' FROM asterisk.queues_config qc';
    sql_live_status += ' LEFT JOIN asterisk.queues_details qd ON qc.extension = qd.id';
    sql_live_status += " LEFT JOIN asterisk.users ps ON qd.data = CONCAT('Local/', ps.extension, '@from-queue/n,0')";
    sql_live_status += " WHERE qd.keyword = 'member' AND qc.extension = '" + queue_id + "'";

    let query = connection.query(sql_live_status, (err, result_live_status) => {
        if (err) throw err;
        if (result_live_status.length > 0) {
            Object.keys(result_live_status).forEach(function (key) {
                var row = result_live_status[key];
                var agents = row.queue_agents;

                const valuesArray = agents.split(',');
                const modifiedArray = valuesArray.map((value) => {
                    return value.replace(/^Local\//, '').replace(/@from-queue\/n,0$/, '');
                });
                const resultStringOne = modifiedArray.join(',');
                const numericValues = resultStringOne.match(/\d+/g).filter((value) => value !== '0');
                const resultString = numericValues.join(', ');
                const resultArray = resultString.split(', ');

                const live_queue_detail = {
                    allocated_agents: row.Allocated_agents,
                    agents_logged: row.Agents_Logged,
                    agents_free: row.Agents_Free,
                    agents_occupied: row.Agents_Occupied,
                    offerd_calls: row.offerd_calls,
                    answer_calls: row.answer_calls,
                    tot_abn_calls: row.tot_abn_calls,
                    connected_calls: row.connected_calls,
                    pending_calls: row.pending_calls,
                    SLA: row.SLA,
                    aban_rate: row.AbanRate,
                    AHT: row.AHT,
                    queue_agents: resultArray,
                };

                res.send({
                    live_queue_detail: live_queue_detail,
                });
            });
        }
    });
}

async function getLoginApproval(req, res, next) {
    var sql_login_approval = 'SELECT';
    sql_login_approval += ' tbl_login_approval.id, ';
    sql_login_approval += ' tbl_com_mst.com_name, ';
    sql_login_approval += ' tbl_login_approval.user_id, ';
    sql_login_approval += ' user_master.fname, ';
    sql_login_approval += ' user_master.username, ';
    sql_login_approval += " CONCAT(user_master.fname,' ', user_master.lname) AS fullname,";
    sql_login_approval += ' tbl_login_approval.status, ';
    sql_login_approval += ' tbl_login_approval.cre_datetime ';
    sql_login_approval += ' FROM phonikip_db.tbl_login_approval';
    sql_login_approval += ' JOIN phonikip_db.user_master ON tbl_login_approval.user_id = user_master.id ';
    sql_login_approval += ' JOIN phonikip_db.tbl_com_mst ON user_master.com_id = tbl_com_mst.id ';
    sql_login_approval += " WHERE tbl_login_approval.status = 'Pending' ";

    let query = connection.query(sql_login_approval, (err, result_login_approval) => {
        if (err) throw err;
        var login_approval = new Array();

        if (result_login_approval.length > 0) {
            Object.keys(result_login_approval).forEach(function (key) {
                var row = result_login_approval[key];

                const dateObject = new Date(row.cre_datetime);
                const year = dateObject.getFullYear();
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const day = String(dateObject.getDate()).padStart(2, '0');
                const hours = String(dateObject.getHours()).padStart(2, '0');
                const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const pending_login_approval = {
                    id: row.id,
                    com_name: row.com_name,
                    user_id: row.user_id,
                    firstname: row.fname,
                    username: row.username,
                    fullname: row.fullname,
                    status: row.status,
                    cre_datetime: formattedDate,
                };

                login_approval.push(pending_login_approval);
            });

            res.send({
                pending_login_approval: login_approval,
            });
        } else {
            res.send({
                pending_login_approval: login_approval,
            });
        }
    });
}

async function getBreakApproval(req, res, next) {
    var sql_break_approval = 'SELECT';
    sql_break_approval += ' tbl_break_request.id, ';
    sql_break_approval += ' tbl_break_request.break_type, ';
    sql_break_approval += ' tbl_break_request.sup_action, ';
    sql_break_approval += ' tbl_break_request.user_id, ';
    sql_break_approval += ' user_master.fname, ';
    sql_break_approval += ' user_master.username, ';
    sql_break_approval += " CONCAT(user_master.fname,' ',user_master.lname) AS fullname,";
    sql_break_approval += ' tbl_com_mst.com_name, ';
    sql_break_approval += ' tbl_break_request.cre_datetime ';
    sql_break_approval += ' FROM phonikip_db.tbl_break_request';
    sql_break_approval += ' JOIN phonikip_db.user_master ON tbl_break_request.user_id = user_master.id ';
    sql_break_approval += ' JOIN phonikip_db.tbl_com_mst ON user_master.com_id = tbl_com_mst.id ';
    sql_break_approval += " WHERE tbl_break_request.sup_action = 'Fresh' ";

    let query = connection.query(sql_break_approval, (err, result_break_approval) => {
        if (err) throw err;
        var break_approval = new Array();

        if (result_break_approval.length > 0) {
            Object.keys(result_break_approval).forEach(function (key) {
                var row = result_break_approval[key];

                const dateObject = new Date(row.cre_datetime);
                const year = dateObject.getFullYear();
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const day = String(dateObject.getDate()).padStart(2, '0');
                const hours = String(dateObject.getHours()).padStart(2, '0');
                const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const pending_break_approval = {
                    id: row.id,
                    com_name: row.com_name,
                    break_type: row.break_type,
                    sup_action: row.sup_action,
                    user_id: row.user_id,
                    firstname: row.fname,
                    username: row.username,
                    fullname: row.fullname,
                    cre_datetime: formattedDate,
                };

                break_approval.push(pending_break_approval);
            });

            res.send({
                pending_break_approval: break_approval,
            });
        } else {
            res.send({
                pending_break_approval: break_approval,
            });
        }
    });
}

async function getBreakExceed(req, res, next) {
    var sql_break_exceed = 'SELECT';
    sql_break_exceed += ' ps_contacts.endpoint, ';
    sql_break_exceed += ' ps_contacts.status, ';
    sql_break_exceed += ' ps_contacts.userid, ';
    sql_break_exceed += ' user_master.fname, ';
    sql_break_exceed += ' user_master.username, ';
    sql_break_exceed += " CONCAT(user_master.fname,' ', user_master.lname) AS fullname, ";
    sql_break_exceed += ' tbl_com_mst.com_name, ';
    sql_break_exceed += ' ps_contacts.update_datetime ';
    sql_break_exceed += ' FROM asterisk.ps_contacts';
    sql_break_exceed += ' JOIN phonikip_db.user_master ON ps_contacts.userid = user_master.id ';
    sql_break_exceed += ' JOIN phonikip_db.tbl_com_mst ON user_master.com_id = tbl_com_mst.id ';
    sql_break_exceed += " WHERE ps_contacts.status_des = 'Exceeded' ";

    let query = connection.query(sql_break_exceed, (err, result_break_exceed) => {
        if (err) throw err;
        var break_exceed = new Array();

        if (result_break_exceed.length > 0) {
            Object.keys(result_break_exceed).forEach(function (key) {
                var row = result_break_exceed[key];

                const dateObject = new Date(row.update_datetime);
                const year = dateObject.getFullYear();
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const day = String(dateObject.getDate()).padStart(2, '0');
                const hours = String(dateObject.getHours()).padStart(2, '0');
                const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const pending_break_exceed = {
                    endpoint: row.endpoint,
                    com_name: row.com_name,
                    user_id: row.userid,
                    firstname: row.fname,
                    username: row.username,
                    fullname: row.fullname,
                    status: row.status,
                    status_des: row.status_des,
                    cre_datetime: formattedDate,
                };

                break_exceed.push(pending_break_exceed);
            });

            res.send({
                pending_break_exceed: break_exceed,
            });
        } else {
            res.send({
                pending_break_exceed: break_exceed,
            });
        }
    });
}

async function getACWStatus(req, res, next) {
    var sql_acw_status = 'SELECT';
    sql_acw_status += ' ps_contacts.endpoint, ';
    sql_acw_status += ' ps_contacts.status, ';
    sql_acw_status += ' ps_contacts.userid, ';
    sql_acw_status += ' user_master.fname, ';
    sql_acw_status += ' user_master.username, ';
    sql_acw_status += " CONCAT(user_master.fname,' ', user_master.lname) AS fullname, ";
    sql_acw_status += ' tbl_com_mst.com_name, ';
    sql_acw_status += ' ps_contacts.update_datetime ';
    sql_acw_status += ' FROM asterisk.ps_contacts';
    sql_acw_status += ' JOIN phonikip_db.user_master ON ps_contacts.userid = user_master.id ';
    sql_acw_status += ' JOIN phonikip_db.tbl_com_mst ON user_master.com_id = tbl_com_mst.id ';
    sql_acw_status += " WHERE ps_contacts.status = 'ACW' ";

    let query = connection.query(sql_acw_status, (err, result_acw_status) => {
        if (err) throw err;
        var acw_status = new Array();

        if (result_acw_status.length > 0) {
            Object.keys(result_acw_status).forEach(function (key) {
                var row = result_acw_status[key];

                const dateObject = new Date(row.update_datetime);
                const year = dateObject.getFullYear();
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const day = String(dateObject.getDate()).padStart(2, '0');
                const hours = String(dateObject.getHours()).padStart(2, '0');
                const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const pending_acw_status = {
                    endpoint: row.endpoint,
                    com_name: row.com_name,
                    user_id: row.userid,
                    firstname: row.fname,
                    username: row.username,
                    fullname: row.fullname,
                    status: row.status,
                    cre_datetime: formattedDate,
                };

                acw_status.push(pending_acw_status);
            });

            res.send({
                pending_acw_status: acw_status,
            });
        } else {
            res.send({
                pending_acw_status: acw_status,
            });
        }
    });
}

async function getCallbackRequest(req, res, next) {
    const current_datetime = moment().format('Y-MM-DD');

    var sql_clbk_req = 'SELECT DISTINCT ';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.in_datetime,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.cbstatus,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.agent_cbstatus,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.id,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.linkedid AS rec_linkedid,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.cre_datetime AS incoming_date,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.frm_caller_num AS incoming_num,';
    sql_clbk_req += 'phonikip_db.tbl_calls_evnt.did_num AS did,';
    sql_clbk_req += 'phonikip_db.csp_callhistory_detail.sipid AS agnt_sipid,';
    sql_clbk_req += "CONCAT(user_master.fname,' ',user_master.lname) AS agnt_name,";
    sql_clbk_req += 'phonikip_db.csp_callhistory_detail.callback_Status, phonikip_db.csp_callhistory_detail.call_log,';
    sql_clbk_req += 'phonikip_db.csp_callhistory_detail.callback_datetime,';
    sql_clbk_req += 'asterisk.queues_config.extension,';
    sql_clbk_req += 'asterisk.queues_config.descr AS queue_name,';
    sql_clbk_req +=
        '(SELECT phonikip_db.user_master.fname AS cre_user_name FROM phonikip_db.user_master WHERE id = phonikip_db.tbl_calls_evnt.agnt_userid) AS cre_user_name,';
    sql_clbk_req +=
        '(SELECT phonikip_db.tbl_calls_evnt.status FROM phonikip_db.tbl_calls_evnt WHERE uniqueid = phonikip_db.csp_callhistory_detail.callback_unq_id ) AS callbackStatus,';
    sql_clbk_req +=
        "(SELECT CONCAT(title,' ',firstname,' ',lastname) AS fullName FROM phonikip_db.csp_contact_master WHERE SUBSTRING(primary_contact, -9, 9) = SUBSTRING(incoming_num, -9, 9) LIMIT 1) AS fullName ";
    sql_clbk_req += 'FROM phonikip_db.tbl_calls_evnt ';
    sql_clbk_req +=
        'JOIN asterisk.queues_config ON asterisk.queues_config.extension = phonikip_db.tbl_calls_evnt.agnt_queueid ';
    sql_clbk_req +=
        "LEFT JOIN phonikip_db.csp_callhistory_detail ON phonikip_db.tbl_calls_evnt.linkedid = phonikip_db.csp_callhistory_detail.unq_id  and phonikip_db.csp_callhistory_detail.log_type = 'AbandonCallback' ";
    sql_clbk_req +=
        'LEFT JOIN phonikip_db.user_master ON phonikip_db.user_master.id = phonikip_db.csp_callhistory_detail.created_userid ';
    sql_clbk_req +=
        "WHERE phonikip_db.tbl_calls_evnt.cre_datetime BETWEEN '" +
        current_datetime +
        " 00:00:00' and '" +
        current_datetime +
        " 23:00:00' AND phonikip_db.tbl_calls_evnt.status = 'ANSWER' AND phonikip_db.tbl_calls_evnt.agent_cbstatus = '0' GROUP BY phonikip_db.tbl_calls_evnt.cre_datetime";

    let query = connection.query(sql_clbk_req, (err, result_clbk_req) => {
        if (err) throw err;
        var clbk_req = new Array();

        if (result_clbk_req.length > 0) {
            Object.keys(result_clbk_req).forEach(function (key) {
                var row = result_clbk_req[key];

                const dateObject = new Date(row.incoming_date);
                const year = dateObject.getFullYear();
                const month = String(dateObject.getMonth() + 1).padStart(2, '0');
                const day = String(dateObject.getDate()).padStart(2, '0');
                const hours = String(dateObject.getHours()).padStart(2, '0');
                const minutes = String(dateObject.getMinutes()).padStart(2, '0');
                const seconds = String(dateObject.getSeconds()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

                const pending_clbk_req = {
                    queue_name: row.queue_name,
                    cli: row.incoming_num,
                    created_user: row.cre_user_name,
                    did: row.did,
                    incoming_date: formattedDate,
                };

                clbk_req.push(pending_clbk_req);
            });

            res.send({
                pending_clbk_req: clbk_req,
            });
        } else {
            res.send({
                pending_clbk_req: clbk_req,
            });
        }
    });
}

async function updateLoginApproval(req, res, next) {
    var record_id = req.body.record_id;
    var status = req.body.status;
    var state = req.body.state;
    var sup_comment = '';
    if (status == 'Rejected') {
        sup_comment = req.body.sup_comment;
    }
    var loggedUser = req.body.loggedUser;

    var get_user = "SELECT id FROM phonikip_db.user_master WHERE user_master.username = '" + loggedUser + "'";

    new_conn.query(get_user, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var user_id = result[0].id;
            var update_login_approval =
                "UPDATE phonikip_db.tbl_login_approval SET update_datetime = NOW(), reject_reason = '" +
                sup_comment +
                "', update_user = '" +
                user_id +
                "', status = '" +
                status +
                "' WHERE id = '" +
                record_id +
                "'";

            let query = connection.query(update_login_approval, (err, result_update_approval) => {
                if (err) {
                    res.send('failed');
                    throw err;
                } else {
                    if (state === true) {
                        res.send('approved');
                    } else {
                        res.send('rejected');
                    }
                }
            });
        } else {
            res.send('failed');
        }
    });
}

async function updateBreakApproval(req, res, next) {
    var record_id = req.body.record_id;
    var status = req.body.status;
    var state = req.body.state;
    var break_type = req.body.break_type;
    var sup_comment = '';
    if (status == 'Rejected') {
        sup_comment = req.body.sup_comment;
    }
    var loggedUser = req.body.loggedUser;

    var get_user = "SELECT id FROM phonikip_db.user_master WHERE user_master.username = '" + loggedUser + "'";

    new_conn.query(get_user, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var user_id = result[0].id;
            var update_break_approval =
                "UPDATE phonikip_db.tbl_break_request SET sup_act_datetime = NOW(), sup_userid = '" +
                user_id +
                "', sup_action = '" +
                status +
                "', sup_remark = '" +
                sup_comment +
                "' WHERE id = '" +
                record_id +
                "'";

            let query = connection.query(update_break_approval, (err, result_update_approval) => {
                if (err) {
                    res.send('failed');
                    throw err;
                } else {
                    if (state === true) {
                        var get_break_user =
                            "SELECT user_id FROM phonikip_db.tbl_break_request WHERE id = '" + record_id + "'";

                        new_conn.query(get_break_user, function (err, result) {
                            if (err) throw err;

                            if (result.length > 0) {
                                var agent_id = result[0].user_id;
                                var get_user_status =
                                    "SELECT status , endpoint FROM asterisk.ps_contacts WHERE userid = '" +
                                    agent_id +
                                    "'";

                                new_conn.query(get_user_status, function (err, result) {
                                    if (err) throw err;

                                    if (result.length > 0) {
                                        var agent_status = result[0].status;
                                        var agent_endpoint = result[0].endpoint;

                                        if (agent_status == 'Online') {
                                            const current_date = moment().format('Y-MM-DD');
                                            var insert_break_status =
                                                "INSERT INTO phonikip_db.tbl_agnt_evnt (agnt_event, date, agnt_userid, agnt_sipid, cre_datetime, agnt_desc) VALUES ('Break Start', '" +
                                                current_date +
                                                "', '" +
                                                agent_id +
                                                "', '" +
                                                agent_endpoint +
                                                "', NOW(), '" +
                                                break_type +
                                                "')";
                                            let insert_query = connection.query(
                                                insert_break_status,
                                                (err, result_insert_status) => {
                                                    if (err) {
                                                        throw err;
                                                    }
                                                },
                                            );

                                            var update_break_status =
                                                "UPDATE asterisk.ps_contacts SET update_datetime = NOW(), status = 'Break', status_des = '" +
                                                break_type +
                                                "' WHERE endpoint = '" +
                                                agent_endpoint +
                                                "'";
                                            let query = connection.query(
                                                update_break_status,
                                                (err, result_update_status) => {
                                                    if (err) {
                                                        res.send('failed');
                                                        throw err;
                                                    } else {
                                                        res.send('approved');
                                                    }
                                                },
                                            );
                                        } else {
                                            res.send('failed');
                                        }
                                    } else {
                                        res.send('failed');
                                    }
                                });
                            } else {
                                res.send('failed');
                            }
                        });
                    } else {
                        res.send('rejected');
                    }
                }
            });
        } else {
            res.send('failed');
        }
    });
}

async function getQueueAllocation(req, res, next) {
    var queue_id = req.body.queue_id;
    console.log('queue_id:' + queue_id);

    var sql_queue_allocation = 'SELECT';
    sql_queue_allocation +=
        " (SELECT GROUP_CONCAT(data, ' ') AS queue_agents FROM asterisk.queues_details WHERE keyword ='member' AND id = '" +
        queue_id +
        "') AS queue_agents,";
    sql_queue_allocation +=
        " (SELECT GROUP_CONCAT(extension, ' ') AS total_agents FROM asterisk.users ) AS total_agents,";
    // sql_queue_allocation += " (SELECT GROUP_CONCAT(phonikip_db.user_master.fname, ' ') AS total_agent_names FROM asterisk.users JOIN phonikip_db.user_master ON asterisk.users.extension = phonikip_db.user_master.extension ) AS total_agent_names";
    // sql_queue_allocation += "(SELECT GROUP_CONCAT(phonikip_db.user_master.fname, ' ' ORDER BY asterisk.users.extension ASC) AS total_agent_names FROM asterisk.users LEFT JOIN phonikip_db.user_master ON asterisk.users.extension = phonikip_db.user_master.extension) AS total_agent_names ";

    sql_queue_allocation +=
        "(SELECT GROUP_CONCAT(COALESCE(phonikip_db.user_master.fname, ''), ' ' ORDER BY asterisk.users.extension ASC) AS total_agent_names FROM asterisk.users LEFT JOIN phonikip_db.user_master ON asterisk.users.extension = phonikip_db.user_master.extension) AS total_agent_names ";

    sql_queue_allocation += ' FROM asterisk.queues_details LIMIT 1';

    let query = connection.query(sql_queue_allocation, (err, result_queue_allocation) => {
        if (err) throw err;
        if (result_queue_allocation.length > 0) {
            Object.keys(result_queue_allocation).forEach(function (key) {
                var row = result_queue_allocation[key];
                var queue_agents = row.queue_agents;
                var total_agents = row.total_agents;
                var total_agent_names = row.total_agent_names;

                const valuesArray = queue_agents.split(',');
                const modifiedArray = valuesArray.map((value) => {
                    return value.replace(/^Local\//, '').replace(/@from-queue\/n,0$/, '');
                });
                const resultStringOne = modifiedArray.join(',');
                const numericValues = resultStringOne.match(/\d+/g).filter((value) => value !== '0');

                const resultString = numericValues.join(', ');
                const arrayWithQuotes = resultString.split(', ');
                const queueAgentsArray = arrayWithQuotes.map((numberString) => parseInt(numberString));

                const queueTotalArray = total_agents.split(',').map((number) => parseInt(number.trim()));
                const queueTotalArrayNames = total_agent_names.split(',');

                console.log('queue total array names ' + queueTotalArrayNames);

                res.send({
                    queueAgentsArray: queueAgentsArray,
                    queueTotalArray: queueTotalArray,
                    queueTotalArrayNames: queueTotalArrayNames,
                });
            });
        }
    });
}

async function updateQueueAllocation(req, res, next) {
    var queue_agents = req.body.queue_agents;
    var queue_id = req.body.queue_id;
    var loggedUser = req.body.loggedUser;
    var agent_array = [];

    var get_user = "SELECT id FROM phonikip_db.user_master WHERE user_master.username = '" + loggedUser + "'";

    new_conn.query(get_user, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var user_id = result[0].id;
            var insert_log =
                "INSERT INTO phonikip_db.tbl_user_auth_log (ip_address, user_id, event, des, datetime) VALUES (' ', '" +
                user_id +
                "', 'Queue Allocation', '" +
                queue_agents +
                "', NOW())";
            let insert_query = connection.query(insert_log, (err, result_insert) => {
                if (err) {
                    throw err;
                }
            });
        }
    });

    for (let i = 0; i < queue_agents.length; i++) {
        let queue_member = 'Local/' + queue_agents[i] + '@from-queue/n,0';
        agent_array.push(queue_member);
    }

    var delete_queue_extensions =
        "DELETE FROM asterisk.queues_details WHERE asterisk.queues_details.id = '" +
        queue_id +
        "' AND asterisk.queues_details.keyword = 'member';";

    let query = connection.query(delete_queue_extensions, (err, result_delete_extensions) => {
        if (err) {
            throw err;
        } else {
            for (let j = 0; j < agent_array.length; j++) {
                var insert_queue_members =
                    "INSERT INTO asterisk.queues_details (id, keyword, data, flags) VALUES ('" +
                    queue_id +
                    "', 'member', '" +
                    agent_array[j] +
                    "', '" +
                    j +
                    "')";

                let query = connection.query(insert_queue_members, (err, result_insert_members) => {
                    if (err) {
                        throw err;
                    }
                });
            }

            exec('fwconsole reload', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${error}`);
                    res.send('failed');
                }
                console.log(`stdout: ${stdout}`);
                res.send('success');
            });
        }
    });
}

async function getAgentQueueAllocation(req, res, next) {
    var endpoint = req.body.endpoint;
    var endpoint_detail = 'Local/' + endpoint + '@from-queue/n,0';

    var sql_agent_queue_allocation = 'SELECT';
    sql_agent_queue_allocation +=
        " (SELECT GROUP_CONCAT(id, ' ') AS agent_queues FROM asterisk.queues_details WHERE keyword ='member' AND data = '" +
        endpoint_detail +
        "') AS agent_queues,";
    sql_agent_queue_allocation +=
        " (SELECT GROUP_CONCAT(extension, ' ') AS total_queues FROM asterisk.queues_config ) AS total_queues,";
    sql_agent_queue_allocation +=
        " (SELECT GROUP_CONCAT(descr, ' ') AS queue_names FROM asterisk.queues_config ) AS queue_names";
    sql_agent_queue_allocation += ' FROM asterisk.queues_details LIMIT 1';

    let query = connection.query(sql_agent_queue_allocation, (err, result_queue_allocation) => {
        if (err) throw err;
        if (result_queue_allocation.length > 0) {
            Object.keys(result_queue_allocation).forEach(function (key) {
                var row = result_queue_allocation[key];
                var agent_queues = row.agent_queues;
                var total_queues = row.total_queues;
                var queue_names = row.queue_names;

                const totalQueueArray = total_queues.split(',').map((number) => parseInt(number.trim()));
                if (agent_queues) {
                    var agentQueueArray = agent_queues.split(',').map((number) => parseInt(number.trim()));
                } else {
                    var agentQueueArray = [];
                }
                const agentQueueNames = queue_names.split(',');

                res.send({
                    totalQueueArray: totalQueueArray,
                    agentQueueArray: agentQueueArray,
                    agentQueueNames: agentQueueNames,
                });
            });
        }
    });
}

async function updateAgentQueueAllocation(req, res, next) {
    var agent_queues = req.body.agent_queues;
    var endpoint = req.body.endpoint;
    var loggedUser = req.body.loggedUser;
    var endpoint_detail = 'Local/' + endpoint + '@from-queue/n,0';

    var get_user = "SELECT id FROM phonikip_db.user_master WHERE user_master.username = '" + loggedUser + "'";

    new_conn.query(get_user, function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            var user_id = result[0].id;
            var insert_log =
                "INSERT INTO phonikip_db.tbl_user_auth_log (ip_address, user_id, event, des, datetime) VALUES (' ', '" +
                user_id +
                "', 'Agent Queue Allocation', '" +
                agent_queues +
                "', NOW())";
            let insert_query = connection.query(insert_log, (err, result_insert) => {
                if (err) {
                    throw err;
                }
            });
        }
    });

    var delete_queue_extensions =
        "DELETE FROM asterisk.queues_details WHERE asterisk.queues_details.data = '" +
        endpoint_detail +
        "' AND asterisk.queues_details.keyword = 'member';";

    let query = connection.query(delete_queue_extensions, (err, result_delete_extensions) => {
        if (err) {
            throw err;
        } else {
            for (let j = 0; j < agent_queues.length; j++) {
                var insert_queue_members =
                    "INSERT INTO asterisk.queues_details (id, keyword, data, flags) VALUES ('" +
                    agent_queues[j] +
                    "', 'member', '" +
                    endpoint_detail +
                    "', '" +
                    j +
                    "')";

                let query = connection.query(insert_queue_members, (err, result_insert_members) => {
                    if (err) {
                        throw err;
                    }
                });
            }

            exec('fwconsole reload', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${error}`);
                    res.send('failed');
                }
                console.log(`stdout: ${stdout}`);
                res.send('success');
            });
        }
    });
}

async function currentUser(req, res, next) {
    var dashboard_users = req.body.user_session;
    console.log('Dashboard User: ' + dashboard_users);

    res.send({
        status: 'success',
    });
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/nest', addNest);
app.post('/updateacw', updateacw);
app.get('/events', eventsHandler);
app.post('/getUser', getUser);
app.post('/getUserDetail', getUserDetail);

app.post('/getQueueDetail', getQueueDetail);
app.post('/getQueueAllocation', getQueueAllocation);
app.post('/updateQueueAllocation', updateQueueAllocation);
app.post('/getAgentQueueAllocation', getAgentQueueAllocation);
app.post('/updateAgentQueueAllocation', updateAgentQueueAllocation);

app.post('/getLoginApproval', getLoginApproval);
app.post('/updateLoginApproval', updateLoginApproval);

app.post('/getBreakApproval', getBreakApproval);
app.post('/updateBreakApproval', updateBreakApproval);

app.post('/getBreakExceed', getBreakExceed);
app.post('/getACWStatus', getACWStatus);
app.post('/getCallbackRequest', getCallbackRequest);
app.post('/currentUser', currentUser);
app.get('/status', (req, res) => res.json({ clients: clients.length }));

const PORT = 3005;

let nests = [];

app.listen(PORT, () => '');
